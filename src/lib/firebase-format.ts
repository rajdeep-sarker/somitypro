export const FIREBASE_TABLES = [
  "account_heads", "attendance", "bulk_batches", "cash_entries", "centers", "designations",
  "dps_accounts", "dps_schemes", "dps_transactions", "entry_edit_history", "fdr_accounts", "fdr_schemes",
  "fdr_transactions", "ledger_accounts", "ledger_revisions", "ledger_transactions", "loan_repayments", "loans",
  "member_fees", "members", "notification_drafts", "profiles", "salary_payments", "savings_transactions",
  "somiti_rules", "somiti_settings", "staff", "staff_permissions", "user_roles",
] as const;

export const MONEY_FIELDS = ["amount", "principal", "total_payable", "paid", "profit"];

type V = Record<string, unknown>;
export function toFirestoreValue(v: unknown): V {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === "object") return { mapValue: { fields: toFirestoreFields(v as Record<string, unknown>) } };
  return { stringValue: String(v) };
}
export function toFirestoreFields(r: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(r).map(([k, x]) => [k, toFirestoreValue(x)]));
}

/** Sum of each money column present in the rows, rounded to paisa. */
export function moneyTotals(rows: Record<string, unknown>[], fields: string[]) {
  const out: Record<string, number> = {};
  for (const r of rows) for (const f of fields) if (f in r) out[f] = (out[f] ?? 0) + (Number(r[f]) || 0);
  for (const f in out) out[f] = Math.round(out[f] * 100) / 100;
  return out;
}
