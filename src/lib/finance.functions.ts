import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { calcLoan } from "./calc";

// Financial writes that used to be database procedures/triggers, now enforced
// here: validation, balance invariants, atomic batches and audit history.

type Row = Record<string, unknown>;

async function db() {
  return import("./firebase-admin.server");
}

const perm = () => import("./permissions.server");
const EDITABLE = new Set(["amount", "units", "txn_date", "note", "reference", "late_fee", "type", "principal", "interest_rate", "service_charge", "installment_count", "installment_type", "first_due_date", "disburse_date", "purpose", "guarantor", "status", "installment_amount", "maturity_date", "start_date", "month", "fee_type", "head_id", "kind", "name", "phone", "address"]);

async function isAdmin(userId: string): Promise<boolean> {
  const admin = await db();
  const roles = await admin.listCollection("user_roles");
  return roles.some((r) => r["user_id"] === userId && r["role"] === "admin");
}

async function canCollect(userId: string): Promise<boolean> {
  if (await isAdmin(userId)) return true;
  const admin = await db();
  const perms = await admin.listCollection("staff_permissions");
  return perms.some((p) => p["user_id"] === userId && p["module"] === "collection" && p["can_write"] === true);
}

const amount = z.number().finite().positive();
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

function audit(table: string, rowId: string, before: Row, after: Row, userId: string): Row {
  return {
    id: crypto.randomUUID(),
    table_name: table,
    row_id: rowId,
    before_values: before,
    after_values: after,
    edited_by: userId,
    edited_at: new Date().toISOString(),
  };
}

function checkNumbers(values: Row) {
  for (const [k, v] of Object.entries(values)) {
    if (typeof v === "number" && (!Number.isFinite(v) || v < 0)) throw new Error("সঠিক সংখ্যা দিন");
    if (k === "amount" && typeof v === "number" && v <= 0) throw new Error("টাকার পরিমাণ শূন্যের বেশি হতে হবে");
  }
}

/** Optimistic concurrency: the row must still hold the values the editor saw. */
function checkExpected(current: Row, changed: Row, expected: Row) {
  for (const k of Object.keys(changed)) {
    if (JSON.stringify(current[k] ?? null) !== JSON.stringify(expected[k] ?? null)) {
      throw new Error("এই তথ্য ইতিমধ্যে অন্য কেউ পরিবর্তন করেছেন — পাতা রিফ্রেশ করে আবার চেষ্টা করুন");
    }
  }
}

export const bulkCollect = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(
    z.object({
      batch: z.string().uuid(),
      date: z.string().regex(dateRe),
      rows: z
        .array(z.object({ kind: z.enum(["savings", "loan", "dps"]), member_id: z.string().uuid(), account_id: z.string(), amount }))
        .min(1)
        .max(1000),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!(await canCollect(context.userId))) throw new Error("বাল্ক কালেকশনের অনুমতি নেই");
    const admin = await db();
    const now = new Date().toISOString();
    const writes = [];
    const fsDb = await admin.fsDb();
    const loanIds: string[] = [];
    const [allMembers, allLoans, allDps] = await Promise.all([admin.listCollection("members"), admin.listCollection("loans"), admin.listCollection("dps_accounts")]);
    const memberIds = new Set(allMembers.map((m) => String(m["id"])));
    const loanOwner = new Map(allLoans.map((l) => [String(l["id"]), String(l["member_id"])]));
    const dpsOwner = new Map(allDps.map((a) => [String(a["id"]), String(a["member_id"])]));
    for (const row of data.rows) {
      if (!memberIds.has(row.member_id)) throw new Error("সদস্য পাওয়া যায়নি");
      if (row.kind === "loan" && loanOwner.get(row.account_id) !== row.member_id) throw new Error("ঋণ হিসাবটি এই সদস্যের নয়");
      if (row.kind === "dps" && dpsOwner.get(row.account_id) !== row.member_id) throw new Error("DPS হিসাবটি এই সদস্যের নয়");
    }
    for (const row of data.rows) {
      if (row.kind === "savings") {
        writes.push(admin.wSet(fsDb, "savings_transactions", crypto.randomUUID(), { member_id: row.member_id, type: "deposit", amount: row.amount, txn_date: data.date, note: null, created_by: context.userId, created_at: now }));
      } else if (row.kind === "loan") {
        if (!z.string().uuid().safeParse(row.account_id).success) throw new Error("ঋণের হিসাব সঠিক নয়");
        loanIds.push(row.account_id);
        writes.push(admin.wSet(fsDb, "loan_repayments", crypto.randomUUID(), { loan_id: row.account_id, member_id: row.member_id, amount: row.amount, late_fee: 0, txn_date: data.date, note: null, created_by: context.userId, created_at: now }));
      } else {
        if (!z.string().uuid().safeParse(row.account_id).success) throw new Error("DPS হিসাব সঠিক নয়");
        writes.push(admin.wSet(fsDb, "dps_transactions", crypto.randomUUID(), { account_id: row.account_id, member_id: row.member_id, type: "deposit", amount: row.amount, txn_date: data.date, note: null, created_by: context.userId, created_at: now }));
      }
    }
    // Close loans whose repayments now cover the payable amount.
    if (loanIds.length) {
      const [loans, repayments] = await Promise.all([admin.listCollection("loans"), admin.listCollection("loan_repayments")]);
      const added = new Map<string, number>();
      for (const row of data.rows) if (row.kind === "loan") added.set(row.account_id, (added.get(row.account_id) ?? 0) + row.amount);
      for (const id of new Set(loanIds)) {
        const loan = loans.find((l) => l["id"] === id);
        if (!loan || loan["status"] !== "active") continue;
        const paid = repayments.filter((r) => r["loan_id"] === id).reduce((a, r) => a + (Number(r["amount"]) || 0), 0) + (added.get(id) ?? 0);
        if (paid >= Number(loan["total_payable"])) writes.push(admin.wUpdate(fsDb, "loans", id, { status: "closed" }));
      }
    }
    writes.push((await import("./activity.server")).logWrite(fsDb, context, "bulk", "bulk_collection", data.batch, [`${data.rows.length}`]));
    writes.push(admin.wSet(fsDb, "bulk_batches", data.batch, { id: data.batch, kind: "collection", row_count: data.rows.length, created_by: context.userId, created_at: now }));
    await admin.commitWrites(writes);
    return { count: data.rows.length };
  });

export const importMembers = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(
    z.object({
      batch: z.string().uuid(),
      rows: z
        .array(z.object({ member_no: z.string().max(40).optional(), name: z.string().min(1).max(120), phone: z.string().max(20).nullish(), address: z.string().max(300).nullish(), nid: z.string().max(40).nullish() }))
        .min(1)
        .max(1000),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("শুধু অ্যাডমিন সদস্য আমদানি করতে পারবেন");
    const admin = await db();
    const existing = await admin.listCollection("members");
    const used = new Set(existing.map((m) => String(m["member_no"] ?? "")));
    let best: { num: number; prefix: string; pad: number } | null = null;
    for (const m of existing) {
      const match = String(m["member_no"] ?? "").match(/^(\D*)(\d+)$/);
      if (match && (!best || Number(match[2]) > best.num)) best = { num: Number(match[2]), prefix: match[1] ?? "", pad: match[2]!.length };
    }
    let next = (best?.num ?? 0) + 1;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const fsDb = await admin.fsDb();
    const writes = [];
    for (const row of data.rows) {
      let memberNo = row.member_no?.trim() ?? "";
      if (!memberNo || used.has(memberNo)) {
        do {
          memberNo = `${best?.prefix ?? ""}${String(next++).padStart(best?.pad ?? 4, "0")}`;
        } while (used.has(memberNo));
      }
      used.add(memberNo);
      writes.push(
        admin.wSet(fsDb, "members", crypto.randomUUID(), {
          name: row.name,
          member_no: memberNo,
          phone: row.phone ?? null,
          address: row.address ?? null,
          nid: row.nid ?? null,
          status: "active",
          admission_date: today,
          created_at: now,
        }),
      );
    }
    writes.push((await import("./activity.server")).logWrite(fsDb, context, "bulk", "members_import", data.batch, [`${data.rows.length}`]));
    writes.push(admin.wSet(fsDb, "bulk_batches", data.batch, { id: data.batch, kind: "members", row_count: data.rows.length, created_by: context.userId, created_at: now }));
    await admin.commitWrites(writes);
    return { count: data.rows.length };
  });

const editSchema = z.object({
  table: z.string().min(1),
  id: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
  expected: z.record(z.string(), z.unknown()),
});

export const editSavedEntry = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(editSchema)
  .handler(async ({ data, context }) => {
    const p = await perm();
    if (!p.TABLES.has(data.table) || ["user_roles", "staff_permissions", "profiles", "ledger_transactions", "ledger_revisions", "entry_edit_history", "activity_log"].includes(data.table)) throw new Error("এই তালিকা এখানে সংশোধন করা যায় না");
    for (const k of Object.keys(data.values)) if (!EDITABLE.has(k)) throw new Error("এই ঘর সংশোধন করা যায় না");
    data.values = p.cleanValues(data.values, "update");
    const admin = await db();
    const current = await admin.getDocument(data.table, data.id);
    if (!current) throw new Error("এন্ট্রি পাওয়া যায়নি");
    await p.requireWrite(context.userId, data.table, current);
    checkExpected(current, data.values, data.expected);
    checkNumbers(data.values);
    const next: Row = { ...current, ...data.values };

    if (data.table === "loans") {
      const termsChanged = ["principal", "interest_rate", "service_charge", "installment_count"].some((k) => k in data.values);
      if (termsChanged) {
        const calc = calcLoan(Number(next["principal"]), Number(next["interest_rate"]), Number(next["installment_count"]));
        next["total_payable"] = calc.total;
        next["installment_amount"] = calc.installment;
        data.values["total_payable"] = calc.total;
        data.values["installment_amount"] = calc.installment;
      }
      const [repayments, ledger] = await Promise.all([admin.listCollection("loan_repayments"), admin.listCollection("ledger_transactions")]);
      const paid =
        repayments.filter((r) => r["loan_id"] === data.id).reduce((a, r) => a + (Number(r["amount"]) || 0), 0) +
        ledger.filter((t) => t["loan_id"] === data.id && t["type"] === "waiver").reduce((a, t) => a + (Number(t["amount"]) || 0), 0);
      if (paid > Number(next["total_payable"])) throw new Error("আদায়কৃত টাকার চেয়ে মোট পরিশোধযোগ্য কম হতে পারে না");
    }
    if (data.table === "loan_repayments") {
      const loan = await admin.getDocument("loans", String(next["loan_id"]));
      if (!loan) throw new Error("ঋণ পাওয়া যায়নি");
      if (String(next["member_id"]) !== String(loan["member_id"])) throw new Error("সদস্য ও ঋণের মিল নেই");
      const repayments = await admin.listCollection("loan_repayments");
      const paid = repayments.filter((r) => r["loan_id"] === data.id || r["loan_id"] === next["loan_id"]).reduce((a, r) => a + (Number(r["amount"]) || 0), 0) - (Number(current["amount"]) || 0) + (Number(next["amount"]) || 0);
      if (paid > Number(loan["total_payable"])) throw new Error("মোট পরিশোধযোগ্যের বেশি আদায় হতে পারে না");
    }
    if (["dps_accounts", "fdr_accounts", "loans"].includes(data.table) && "status" in data.values && !(await isAdmin(context.userId))) {
      throw new Error("শুধু অ্যাডমিন অবস্থা পরিবর্তন করতে পারবেন");
    }

    const before: Row = {};
    for (const k of Object.keys(data.values)) before[k] = current[k] ?? null;
    const fsDb = await admin.fsDb();
    await admin.commitWrites([
      ...(data && "from" in data ? [(await import("./activity.server")).logWrite(fsDb, context, "transfer", "banks", String((data as { from: string }).from))] : []),
      admin.wUpdate(fsDb, data.table, data.id, data.values),
      admin.wSet(fsDb, "entry_edit_history", crypto.randomUUID(), audit(data.table, data.id, before, data.values, context.userId)),
      (await import("./activity.server")).logWrite(fsDb, context, "update", data.table, data.id, Object.keys(data.values)),
    ]);
    return { ok: true };
  });

export const correctLedgerEntry = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(editSchema.omit({ table: true }))
  .handler(async ({ data, context }) => {
    const admin = await db();
    const current = await admin.getDocument("ledger_transactions", data.id);
    if (!current) throw new Error("লেনদেন পাওয়া যায়নি");
    for (const k of Object.keys(data.values)) if (!["amount", "units", "txn_date", "note", "reference"].includes(k)) throw new Error("এই ঘর সংশোধন করা যায় না");
    await (await perm()).requireWrite(context.userId, "ledger_transactions", { account_id: current["account_id"] });
    checkExpected(current, data.values, data.expected);
    checkNumbers(data.values);
    const revisions = await admin.listCollection("ledger_revisions");
    const mine = revisions.filter((r) => r["transaction_id"] === data.id);
    const revisionNo = mine.reduce((a, r) => Math.max(a, Number(r["revision_no"]) || 0), 0) + 1;
    const merged: Row = { ...current, ...data.values };
    const before: Row = {};
    for (const k of Object.keys(data.values)) before[k] = current[k] ?? null;
    const fsDb = await admin.fsDb();
    await admin.commitWrites([
      ...(data && "from" in data ? [(await import("./activity.server")).logWrite(fsDb, context, "transfer", "banks", String((data as { from: string }).from))] : []),
      admin.wSet(fsDb, "ledger_revisions", crypto.randomUUID(), {
        transaction_id: data.id,
        revision_no: revisionNo,
        amount: Number(merged["amount"]) || 0,
        units: Number(merged["units"]) || 0,
        txn_date: String(merged["txn_date"] ?? ""),
        note: (merged["note"] as string | null) ?? null,
        reference: (merged["reference"] as string | null) ?? null,
        edited_by: context.userId,
        edited_at: new Date().toISOString(),
      }),
      admin.wSet(fsDb, "entry_edit_history", crypto.randomUUID(), audit("ledger_transactions", data.id, before, data.values, context.userId)),
      (await import("./activity.server")).logWrite(fsDb, context, "update", "ledger_transactions", data.id, Object.keys(data.values)),
    ]);
    return { ok: true };
  });

export const transferBank = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ from: z.string().uuid(), to: z.string().uuid(), amount, date: z.string().regex(dateRe), note: z.string().max(300).nullish() }))
  .handler(async ({ data, context }) => {
    if (data.from === data.to) throw new Error("একই হিসাবে স্থানান্তর হয় না");
    await (await perm()).requireWrite(context.userId, "ledger_transactions", { module: "banks" });
    const admin = await db();
    const [from, to] = await Promise.all([admin.getDocument("ledger_accounts", data.from), admin.getDocument("ledger_accounts", data.to)]);
    if (!from || !to || from["module"] !== "banks" || to["module"] !== "banks") throw new Error("ব্যাংক হিসাব সঠিক নয়");
    if (from["status"] !== "active" || to["status"] !== "active") throw new Error("বন্ধ হিসাবে স্থানান্তর হয় না");
    const now = new Date().toISOString();
    const ref = crypto.randomUUID();
    const base = { member_id: null, loan_id: null, units: 0, txn_date: data.date, note: data.note ?? null, created_by: context.userId, created_at: now };
    const fsDb = await admin.fsDb();
    await admin.commitWrites([
      ...(data && "from" in data ? [(await import("./activity.server")).logWrite(fsDb, context, "transfer", "banks", String((data as { from: string }).from))] : []),
      admin.wSet(fsDb, "ledger_transactions", crypto.randomUUID(), { ...base, account_id: data.from, type: "transfer_out", amount: data.amount, reference: ref }),
      admin.wSet(fsDb, "ledger_transactions", crypto.randomUUID(), { ...base, account_id: data.to, type: "transfer_in", amount: data.amount, reference: ref }),
    ]);
    return { ok: true };
  });
