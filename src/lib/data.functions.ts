import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { TABLES, cleanValues, requireWrite, rolesOf } from "./permissions.server";

// All app data lives in Firestore. The browser never talks to Firestore
// directly; every read/write goes through these functions, which check the
// caller's session and role first.

type Row = import("./permissions.server").Row;
const tableSchema = z.object({ table: z.string().refine((t) => TABLES.has(t), "অজানা তালিকা") });
const act = () => import("./activity.server");
async function db() {
  return import("./firebase-admin.server");
}
/** Apply the latest revision of each ledger entry (append-only corrections). */
function applyRevisions(txns: Row[], revisions: Row[]): Row[] {
  const latest = new Map<string, Row>();
  for (const r of revisions) {
    const id = String(r["transaction_id"]);
    const prev = latest.get(id);
    if (!prev || Number(r["revision_no"]) > Number(prev["revision_no"])) latest.set(id, r);
  }
  return txns.map((t) => {
    const rev = latest.get(String(t["id"]));
    if (!rev) return t;
    return { ...t, amount: rev["amount"], units: rev["units"], txn_date: rev["txn_date"], note: rev["note"], reference: rev["reference"] };
  });
}

/** The signed-in user's role and the sections they may view / enter data in. */
export const myAccess = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const r = await rolesOf(context.userId);
    return { admin: r.admin, cto: r.cto, view: [...r.view], write: [...r.modules] };
  });

export const listRows = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .validator(tableSchema)
  .handler(async ({ data, context }) => {
    const admin = await db();
    const me = await rolesOf(context.userId);
    // The CTO account never reads somiti records.
    if (me.cto && data.table !== "somiti_settings") return [];
    if (data.table === "user_roles") return (await admin.listCollection("user_roles")).filter((r) => r["role"] !== "cto");
    if (data.table === "ledger_transactions") {
      const [txns, revisions] = await Promise.all([admin.listCollection("ledger_transactions"), admin.listCollection("ledger_revisions")]);
      return applyRevisions(txns, revisions);
    }
    return admin.listCollection(data.table);
  });

/** Next member number, keeping the existing prefix/padding pattern. */
async function allocateMemberNo(admin: Awaited<ReturnType<typeof db>>): Promise<string> {
  const members = await admin.listCollection("members");
  let best: { num: number; prefix: string; pad: number } | null = null;
  for (const m of members) {
    const match = String(m["member_no"] ?? "").match(/^(\D*)(\d+)$/);
    if (!match) continue;
    const num = Number(match[2]);
    if (!best || num > best.num) best = { num, prefix: match[1] ?? "", pad: match[2]!.length };
  }
  const n = (best?.num ?? 0) + 1;
  return `${best?.prefix ?? ""}${String(n).padStart(best?.pad ?? 4, "0")}`;
}

export const insertRow = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ table: tableSchema.shape.table, values: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data, context }) => {
    const clean = cleanValues(data.values, "insert");
    await requireWrite(context.userId, data.table, clean);
    const admin = await db();
    const values: Row = { ...clean };
    const id = String(values["id"] ?? crypto.randomUUID());
    values["id"] = id;
    if (!values["created_at"] && !["user_roles", "staff_permissions", "somiti_settings", "somiti_rules"].includes(data.table)) {
      values["created_at"] = new Date().toISOString();
    }
    if (data.table === "members" && !values["member_no"]) values["member_no"] = await allocateMemberNo(admin);
    if (data.table === "savings_transactions" || data.table === "loan_repayments" || data.table === "dps_transactions" || data.table === "member_fees" || data.table === "cash_entries" || data.table === "ledger_transactions") {
      values["created_by"] = context.userId;
    }
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wSet(fsDb, data.table, id, values), (await act()).logWrite(fsDb, context, "create", data.table, id, Object.keys(values))]);
    return { id };
  });

export const updateRow = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ table: tableSchema.shape.table, id: z.string().min(1), values: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data, context }) => {
    const values = cleanValues(data.values, "update");
    const admin = await db();
    const current = await admin.getDocument(data.table, data.id);
    if (!current) throw new Error("এন্ট্রি পাওয়া যায়নি");
    // Permission is checked against the existing row's module as well as the new values.
    await requireWrite(context.userId, data.table, { ...current, ...values });
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wUpdate(fsDb, data.table, data.id, values), (await act()).logWrite(fsDb, context, "update", data.table, data.id, Object.keys(values))]);
    return { ok: true };
  });

export const deleteRow = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ table: tableSchema.shape.table, id: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    await requireWrite(context.userId, data.table);
    const admin = await db();
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wDelete(fsDb, data.table, data.id), (await act()).logWrite(fsDb, context, "delete", data.table, data.id)]);
    return { ok: true };
  });

/** Upsert keyed by natural unique columns (attendance, staff_permissions). */
export const upsertRow = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ table: tableSchema.shape.table, keys: z.array(z.string()).min(1), values: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data, context }) => {
    const values = cleanValues(data.values, "update");
    await requireWrite(context.userId, data.table, values);
    const admin = await db();
    const rows = await admin.listCollection(data.table);
    const existing = rows.find((r) => data.keys.every((k) => String(r[k] ?? "") === String(values[k] ?? "")));
    const fsDb = await admin.fsDb();
    if (existing) {
      await admin.commitWrites([admin.wUpdate(fsDb, data.table, String(existing["id"]), values), (await act()).logWrite(fsDb, context, "update", data.table, String(existing["id"]), Object.keys(values))]);
      return { id: String(existing["id"]) };
    }
    const id = crypto.randomUUID();
    await admin.commitWrites([admin.wSet(fsDb, data.table, id, { ...values, id, created_at: new Date().toISOString() }), (await act()).logWrite(fsDb, context, "create", data.table, id, Object.keys(values))]);
    return { id };
  });

/** Activity log for the admin and CTO, newest first. */
export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const r = await rolesOf(context.userId);
    if (!r.admin && !r.cto) throw new Error("শুধু অ্যাডমিন");
    const admin = await db();
    const rows = await admin.listCollection("activity_log");
    return rows
      .map((x) => ({ id: String(x["id"]), at: String(x["at"] ?? ""), user_name: String(x["user_name"] ?? ""), user_id: String(x["user_id"] ?? ""), action: String(x["action"] ?? ""), table: String(x["table"] ?? ""), row_id: String(x["row_id"] ?? ""), fields: String(x["fields"] ?? "") }))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 3000);
  });
