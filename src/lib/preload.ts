import type { TableName } from "@/lib/db";

// Frequently shared data first. QueryClient deduplicates active page reads.
export const preloadTables = [
  "members", "somiti_settings", "savings_transactions", "loans",
  "loan_repayments", "centers", "dps_accounts", "dps_schemes",
  "dps_transactions", "fdr_accounts", "fdr_schemes", "fdr_transactions",
  "member_fees", "cash_entries", "account_heads", "ledger_accounts",
  "ledger_transactions", "staff", "designations", "attendance",
  "salary_payments", "staff_permissions", "user_roles", "bulk_batches",
  "notification_drafts", "somiti_rules",
] as const satisfies readonly TableName[];

// A small queue prevents preloading from flooding the connection on phones.
export async function runPreloadQueue(
  tasks: Array<() => Promise<unknown>>,
  signal: AbortSignal,
  concurrency = 2,
) {
  let next = 0;
  async function worker() {
    while (!signal.aborted) {
      const task = tasks[next++];
      if (!task) return;
      try { await task(); } catch { /* Navigation retries failed speculative reads. */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
}