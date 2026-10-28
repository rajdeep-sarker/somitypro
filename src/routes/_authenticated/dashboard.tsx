import { useCenterRows } from "@/components/CenterScope";
import { pageHead } from "@/lib/metadata";
import { createFileRoute } from "@tanstack/react-router";
import { Users, PiggyBank, HandCoins, Wallet, CalendarClock, Landmark, AlertTriangle, Receipt } from "lucide-react";
import { PageHeader, StatCard } from "@/components/kit";
import { useRows } from "@/lib/db";
import { DashboardModules } from "@/components/DashboardModules";
import { DashboardCharts } from "@/components/DashboardCharts";
import { bn, sum, taka, todayISO } from "@/lib/format";
import { loanStatus } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("ড্যাশবোর্ড"),
  component: Dashboard,
});

function Dashboard() {
  const today = todayISO();
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
      <PageHeader title="ড্যাশবোর্ড" subtitle="সমিতির আজকের সার্বিক অবস্থা" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="মোট সদস্য" value={bn(members.length)} hint={`সক্রিয় ${bn(members.filter((m) => m.status === "active").length)}`} icon={<Users className="size-5" />} />
        <StatCard label="মোট সঞ্চয়" value={taka(savBal)} tone="success" icon={<PiggyBank className="size-5" />} />
        <StatCard label="অবশিষ্ট ঋণ" value={taka(loanOut)} hint={`সক্রিয় লোন ${bn(active.length)}`} tone="gold" icon={<HandCoins className="size-5" />} />
        <StatCard label="আজকের কালেকশন" value={taka(todayColl)} icon={<Receipt className="size-5" />} />
        <StatCard label="DPS ব্যালেন্স" value={taka(dpsBal)} icon={<CalendarClock className="size-5" />} />
        <StatCard label="FDR আমানত" value={taka(fdrBal)} tone="success" icon={<Landmark className="size-5" />} />
        <StatCard label="মেয়াদোত্তীর্ণ লোন" value={bn(overdue)} tone="destructive" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="মোট ফি আদায়" value={taka(sum(fees, (f) => f.amount))} tone="gold" icon={<Wallet className="size-5" />} />
      </div>
      <div className="mt-6"><DashboardModules /></div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">সমিতির অবস্থা — গ্রাফ</h2>
      <DashboardCharts
        sav={sav} rep={rep} dps={dps} fees={fees}
        cash={cash.map((c) => ({ txn_date: c.txn_date, amount: c.amount, type: c.kind }))}
        members={members}
        loanCounts={{ active: active.length, overdue, closed: loans.length - active.length }}
        mix={{ savings: savBal, dps: dpsBal, fdr: fdrBal, loanOut }}
      />
    </div>
  );
}
