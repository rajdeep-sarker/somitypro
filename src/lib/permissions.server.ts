import { FIREBASE_TABLES } from "./firebase-format";

// Shared server-side authorization for every data write. Never trust the
// browser: roles and module permissions are re-read from the database here.

export const TABLES = new Set<string>(FIREBASE_TABLES);
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
export type Row = Record<string, any>;



async function db() {
  return import("./firebase-admin.server");
}

export async function rolesOf(userId: string) {
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

export async function requireWrite(userId: string, table: string, values?: Row) {
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


const FIELD_RE = /^[a-z][a-z0-9_]{0,40}$/;
const SERVER_OWNED = ["created_by", "edited_by"];
const IMMUTABLE_ON_UPDATE = ["id", "created_at", "created_by"];

/** Keep only well-formed field names and plain JSON values; drop server-owned fields. */
export function cleanValues(values: Row, mode: "insert" | "update"): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(values)) {
    if (!FIELD_RE.test(k)) throw new Error("অবৈধ ঘরের নাম");
    if (SERVER_OWNED.includes(k) || (mode === "update" && IMMUTABLE_ON_UPDATE.includes(k))) continue;
    if (typeof v === "number" && !Number.isFinite(v)) throw new Error("সঠিক সংখ্যা দিন");
    if (v !== null && typeof v === "object" && JSON.stringify(v).length > 20000) throw new Error("তথ্য অনেক বড়");
    if (typeof v === "string" && v.length > 20000) throw new Error("তথ্য অনেক বড়");
    out[k] = v;
  }
  return out;
}
