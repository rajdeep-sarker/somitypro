import { useCenterRows } from "@/components/CenterScope";
import { pageHead } from "@/lib/metadata";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, PiggyBank, HandCoins, Wallet, CalendarClock, Landmark, AlertTriangle, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/kit";
import { useRows } from "@/lib/db";
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

  const quick = [
    { to: "/members", label: "সদস্য তৈরি করুন", icon: Users },
    { to: "/savings", label: "সঞ্চয় কালেকশন", icon: PiggyBank },
    { to: "/loans", label: "লোন প্রদান", icon: HandCoins },
    { to: "/loans/collect", label: "লোন কিস্তি আদায়", icon: Receipt },
    { to: "/dps", label: "DPS কালেকশন", icon: CalendarClock },
    { to: "/fdr", label: "FDR জমা", icon: Landmark },
    { to: "/fees", label: "সমিতি ফি", icon: Wallet },
    { to: "/loans/due", label: "বকেয়া তালিকা", icon: AlertTriangle },
  ] as const;

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
      <h2 className="mb-3 mt-8 text-lg font-semibold">দ্রুত কার্যক্রম</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quick.map((q) => (
          <Link key={q.label} to={q.to}>
            <Card className="flex flex-col items-center gap-2 p-5 text-center shadow-card transition-transform hover:-translate-y-0.5">
              <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
                <q.icon className="size-5" />
              </div>
              <span className="text-sm font-medium">{q.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
