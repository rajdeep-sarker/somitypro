import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { FIREBASE_TABLES } from "./firebase-format";

// All app data lives in Firestore. The browser never talks to Firestore
// directly; every read/write goes through these functions, which check the
// caller's session and role first.

const TABLES = new Set<string>(FIREBASE_TABLES);
const ADMIN_ONLY_WRITE = new Set(["user_roles", "staff_permissions", "somiti_settings", "profiles"]);
const ADMIN_ONLY_EXTRA = new Set(["somiti_rules"]);
// Each table belongs to one permission module (menu section). Ledger tables
// take their module from the account they post to.
const MODULE_TABLES: Record<string, string> = {
  ledger_accounts: "__account__",
  ledger_transactions: "__account__",
  notification_drafts: "notifications",
  centers: "centers",
  members: "members", member_fees: "members",
  savings_transactions: "savings",
  loans: "loans", loan_repayments: "loans", bulk_batches: "loans",
  dps_accounts: "dps", dps_schemes: "dps", dps_transactions: "dps",
  fdr_accounts: "fdr", fdr_schemes: "fdr", fdr_transactions: "fdr",
  cash_entries: "cash", account_heads: "cash",
  staff: "staff", designations: "staff", attendance: "staff", salary_payments: "staff",
};
const LEGACY_MODULES: Record<string, string> = { collection: "loans" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const tableSchema = z.object({ table: z.string().refine((t) => TABLES.has(t), "অজানা তালিকা") });

const act = () => import("./activity.server");

async function db() {
  return import("./firebase-admin.server");
}

async function rolesOf(userId: string) {
  const admin = await db();
  const [roles, perms] = await Promise.all([admin.listCollection("user_roles"), admin.listCollection("staff_permissions")]);
  const mine = perms.filter((p) => p["user_id"] === userId);
  const key = (p: Row) => LEGACY_MODULES[String(p["module"])] ?? String(p["module"]);
  return {
    admin: roles.some((r) => r["user_id"] === userId && r["role"] === "admin"),
    cto: roles.some((r) => r["user_id"] === userId && r["role"] === "cto"),
    view: new Set(mine.map(key)),
    modules: new Set(mine.filter((p) => p["can_write"] === true).map(key)),
  };
}

async function requireWrite(userId: string, table: string, values?: Row) {
  const { admin, cto, modules } = await rolesOf(userId);
  if (admin) return;
  if (cto) throw new Error("CTO অ্যাকাউন্ট সমিতির তথ্য বদলাতে পারে না");
  if (ADMIN_ONLY_WRITE.has(table) || ADMIN_ONLY_EXTRA.has(table)) throw new Error("শুধু অ্যাডমিন এই পরিবর্তন করতে পারবেন");
  const moduleKey = MODULE_TABLES[table];
  if (moduleKey && moduleKey !== "__account__" && !modules.has(moduleKey)) throw new Error("এই বিভাগে এন্ট্রির অনুমতি নেই");
  if (moduleKey === "__account__") {
    let module = String(values?.["module"] ?? "");
    if (!module && values?.["account_id"]) {
      const adb = await db();
      const account = await adb.getDocument("ledger_accounts", String(values["account_id"]));
      module = String(account?.["module"] ?? "");
    }
    if (module && !modules.has(module)) throw new Error("এই বিভাগে এন্ট্রির অনুমতি নেই");
  }
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
  .inputValidator(tableSchema)
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
  .inputValidator(z.object({ table: tableSchema.shape.table, values: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data, context }) => {
    await requireWrite(context.userId, data.table, data.values);
    const admin = await db();
    const values: Row = { ...data.values };
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
  .inputValidator(z.object({ table: tableSchema.shape.table, id: z.string().min(1), values: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data, context }) => {
    await requireWrite(context.userId, data.table, data.values);
    const admin = await db();
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wUpdate(fsDb, data.table, data.id, data.values), (await act()).logWrite(fsDb, context, "update", data.table, data.id, Object.keys(data.values))]);
    return { ok: true };
  });

export const deleteRow = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator(z.object({ table: tableSchema.shape.table, id: z.string().min(1) }))
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
  .inputValidator(z.object({ table: tableSchema.shape.table, keys: z.array(z.string()).min(1), values: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data, context }) => {
    await requireWrite(context.userId, data.table, data.values);
    const admin = await db();
    const rows = await admin.listCollection(data.table);
    const existing = rows.find((r) => data.keys.every((k) => String(r[k] ?? "") === String(data.values[k] ?? "")));
    const fsDb = await admin.fsDb();
    if (existing) {
      await admin.commitWrites([admin.wUpdate(fsDb, data.table, String(existing["id"]), data.values), (await act()).logWrite(fsDb, context, "update", data.table, String(existing["id"]), Object.keys(data.values))]);
      return { id: String(existing["id"]) };
    }
    const id = crypto.randomUUID();
    await admin.commitWrites([admin.wSet(fsDb, data.table, id, { ...data.values, id, created_at: new Date().toISOString() }), (await act()).logWrite(fsDb, context, "create", data.table, id, Object.keys(data.values))]);
    return { id };
  });
