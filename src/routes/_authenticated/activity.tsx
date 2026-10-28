import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { DataTable, PageHeader, SimpleSelect } from "@/components/kit";
import { listActivity } from "@/lib/data.functions";
import { useLang } from "@/lib/i18n";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/activity")({ head: () => pageHead("অ্যাক্টিভিটি লগ"), component: Activity });

const ACTIONS: Record<string, [string, string]> = {
  create: ["নতুন এন্ট্রি", "Created"], update: ["এডিট", "Edited"], delete: ["মুছে ফেলা", "Deleted"], bulk: ["বাল্ক এন্ট্রি", "Bulk entry"],
  transfer: ["ট্রান্সফার", "Transfer"], login: ["লগইন", "Login"], password_reset: ["পাসওয়ার্ড রিসেট", "Password reset"],
};
const TABLES: Record<string, [string, string]> = {
  members: ["সদস্য", "Members"], centers: ["কেন্দ্র", "Centers"], savings_transactions: ["সঞ্চয়", "Savings"], loans: ["লোন", "Loans"], loan_repayments: ["লোন কিস্তি", "Loan installments"],
  dps_accounts: ["DPS হিসাব", "DPS accounts"], dps_transactions: ["DPS লেনদেন", "DPS transactions"], dps_schemes: ["DPS স্কিম", "DPS schemes"], fdr_accounts: ["FDR হিসাব", "FDR accounts"],
  fdr_transactions: ["FDR লেনদেন", "FDR transactions"], fdr_schemes: ["FDR স্কিম", "FDR schemes"], member_fees: ["ফি", "Fees"], cash_entries: ["জমা-খরচ", "Income/expense"], account_heads: ["খাত", "Heads"],
  staff: ["কর্মী", "Staff"], designations: ["পদবি", "Designations"], attendance: ["হাজিরা", "Attendance"], salary_payments: ["বেতন", "Salary"], staff_permissions: ["অনুমতি", "Permissions"],
  ledger_accounts: ["হিসাব", "Accounts"], ledger_transactions: ["লেনদেন", "Transactions"], somiti_settings: ["সেটিং", "Settings"], somiti_rules: ["নীতিমালা", "Rules"],
  notification_drafts: ["বার্তা", "Messages"], auth_users: ["লগইন", "Login"], bulk_collection: ["বাল্ক কালেকশন", "Bulk collection"], members_import: ["সদস্য আমদানি", "Member import"], banks: ["ব্যাংক", "Bank"],
};

function Activity() {
  const { t, lang } = useLang();
  const list = useServerFn(listActivity);
  const { data: rows = [] } = useQuery({ queryKey: ["activity"], queryFn: () => list() });
  const [user, setUser] = useState(""), [action, setAction] = useState(""), [date, setDate] = useState("");
  const users = useMemo(() => Array.from(new Map(rows.map((r) => [r.user_id, r.user_name || r.user_id.slice(0, 8)])).entries()), [rows]);
  const pick = (m: Record<string, [string, string]>, k: string) => (m[k] ? (lang === "en" ? m[k][1] : m[k][0]) : k);
  const shown = rows.filter((r) => (!user || r.user_id === user) && (!action || r.action === action) && (!date || r.at.startsWith(date)));
  const fmt = (iso: string) => new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "bn-BD", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="space-y-5">
      <PageHeader title={t("অ্যাক্টিভিটি লগ", "Activity Log")} subtitle={t("কে, কখন, কোন অংশে কী পরিবর্তন করেছে", "Who changed what, where and when")} />
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4 shadow-card">
        <label className="space-y-1"><span className="block text-sm font-medium">{t("ইউজার", "User")}</span><div className="w-56"><SimpleSelect value={user} onChange={setUser} placeholder={t("সবাই", "Everyone")} options={[{ value: "", label: t("সবাই", "Everyone") }, ...users.map(([v, l]) => ({ value: v, label: l }))]} /></div></label>
        <label className="space-y-1"><span className="block text-sm font-medium">{t("কাজ", "Action")}</span><div className="w-48"><SimpleSelect value={action} onChange={setAction} placeholder={t("সব", "All")} options={[{ value: "", label: t("সব", "All") }, ...Object.keys(ACTIONS).map((k) => ({ value: k, label: pick(ACTIONS, k) }))]} /></div></label>
        <label className="space-y-1"><span className="block text-sm font-medium">{t("তারিখ", "Date")}</span><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" /></label>
      </div>
      <DataTable empty={t("এখনো কোনো লগ নেই", "No activity yet")} head={[t("সময়", "Time"), t("ইউজার", "User"), t("কাজ", "Action"), t("অংশ", "Section"), t("বদলানো ঘর", "Fields")]}
        rows={shown.map((r) => [fmt(r.at), r.user_name || "—", pick(ACTIONS, r.action), pick(TABLES, r.table), <span key="f" className="text-xs text-muted-foreground">{r.fields}</span>])} />
    </div>
  );
}
