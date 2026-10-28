import { useCenterRows } from "@/components/CenterScope";
import { pageHead } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { Users, PiggyBank, HandCoins, Wallet, CalendarClock, Landmark, AlertTriangle, Receipt } from "lucide-react";
import { PageHeader, StatCard } from "@/components/kit";
import { useRows } from "@/lib/db";
import { DashboardModules, QuickActions } from "@/components/DashboardModules";
import { useLang } from "@/lib/i18n";
import { useAccess } from "@/lib/access";
import { DashboardCharts } from "@/components/DashboardCharts";
import { bn, sum, taka, todayISO } from "@/lib/format";
import { loanStatus } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("ড্যাশবোর্ড"),
  component: Dashboard,
});

function Dashboard() {
  const today = todayISO();
  const { t: tr, lang } = useLang();
  const access = useAccess();
  const n = (x: number) => (lang === "en" ? String(x) : bn(x));
  const { data: members = [] } = useCenterRows("members");
  const { data: sav = [] } = useCenterRows("savings_transactions");
  const { data: loans = [] } = useCenterRows("loans");
  const { data: rep = [] } = useCenterRows("loan_repayments");
  const { data: dps = [] } = useCenterRows("dps_transactions");
  const { data: fdr = [] } = useCenterRows("fdr_accounts");
  const { data: fees = [] } = useCenterRows("member_fees");
  const { data: cash = [] } = useRows("cash_entries");

  const savBal = sum(sav, (t) => (t.type === "withdraw" ? -t.amount : t.amount));
  const active = loans.filter((l) => l.status === "active");
  const paidBy = new Map<string, number>();
  rep.forEach((r) => paidBy.set(r.loan_id, (paidBy.get(r.loan_id) ?? 0) + Number(r.amount)));
  const loanOut = sum(active, (l) => l.total_payable - (paidBy.get(l.id) ?? 0));
  const overdue = active.filter((l) => loanStatus(l, paidBy.get(l.id) ?? 0, today).overdueAmount > 0).length;
  const dpsBal = sum(dps, (t) => (t.type === "deposit" || t.type === "profit" ? t.amount : -t.amount));
  const fdrBal = sum(fdr.filter((f) => f.status === "active"), (f) => f.amount);

  const todayColl =
    sum(sav.filter((t) => t.txn_date === today && t.type === "deposit"), (t) => t.amount) +
    sum(rep.filter((t) => t.txn_date === today), (t) => Number(t.amount) + Number(t.late_fee)) +
    sum(dps.filter((t) => t.txn_date === today && t.type === "deposit"), (t) => t.amount) +
    sum(fees.filter((t) => t.txn_date === today), (t) => t.amount);


  return (
    <div>
      <PageHeader title={tr("ড্যাশবোর্ড", "Dashboard")} subtitle={tr("সমিতির আজকের সার্বিক অবস্থা", "Today's overview of the somiti")} />
      <QuickActions />
      {access.admin && <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={tr("মোট সদস্য", "Total members")} value={n(members.length)} hint={`${tr("সক্রিয়", "Active")} ${n(members.filter((m) => m.status === "active").length)}`} icon={<Users className="size-5" />} />
        <StatCard label={tr("মোট সঞ্চয়", "Total savings")} value={taka(savBal)} tone="success" icon={<PiggyBank className="size-5" />} />
        <StatCard label={tr("অবশিষ্ট ঋণ", "Loan outstanding")} value={taka(loanOut)} hint={`${tr("সক্রিয় লোন", "Active loans")} ${n(active.length)}`} tone="gold" icon={<HandCoins className="size-5" />} />
        <StatCard label={tr("আজকের কালেকশন", "Today's collection")} value={taka(todayColl)} icon={<Receipt className="size-5" />} />
        <StatCard label={tr("DPS ব্যালেন্স", "DPS balance")} value={taka(dpsBal)} icon={<CalendarClock className="size-5" />} />
        <StatCard label={tr("FDR আমানত", "FDR deposits")} value={taka(fdrBal)} tone="success" icon={<Landmark className="size-5" />} />
        <StatCard label={tr("মেয়াদোত্তীর্ণ লোন", "Overdue loans")} value={n(overdue)} tone="destructive" icon={<AlertTriangle className="size-5" />} />
        <StatCard label={tr("মোট ফি আদায়", "Total fees")} value={taka(sum(fees, (f) => f.amount))} tone="gold" icon={<Wallet className="size-5" />} />
      </div></div>}
      <div className="mt-6"><DashboardModules /></div>
      {access.admin && <>
      <h2 className="mb-3 mt-8 text-lg font-semibold">{tr("সমিতির অবস্থা — গ্রাফ", "Somiti status — charts")}</h2>
      <DashboardCharts
        sav={sav} rep={rep} dps={dps} fees={fees}
        cash={cash.map((c) => ({ txn_date: c.txn_date, amount: c.amount, type: c.kind }))}
        members={members}
        loanCounts={{ active: active.length, overdue, closed: loans.length - active.length }}
        mix={{ savings: savBal, dps: dpsBal, fdr: fdrBal, loanOut }}
      />
      </>}
    </div>
  );
}
