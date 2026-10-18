import { pageHead } from "@/lib/metadata";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, PageHeader, StatCard } from "@/components/kit";
import { useRows, useUpdate } from "@/lib/db";
import { bnDate, sum, taka } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/members/$id")({
  head: () => pageHead("সদস্যের বিবরণ"),
  component: MemberDetail,
});

const typeLabel: Record<string, string> = { deposit: "জমা", withdraw: "উত্তোলন", profit: "লভ্যাংশ", profit_withdraw: "লভ্যাংশ উত্তোলন", service_charge: "সার্ভিস চার্জ" };

function MemberDetail() {
  const { id } = Route.useParams();
  const { data: members = [] } = useRows("members");
  const { data: sav = [] } = useRows("savings_transactions");
  const { data: loans = [] } = useRows("loans");
  const { data: rep = [] } = useRows("loan_repayments");
  const { data: dps = [] } = useRows("dps_transactions");
  const { data: fees = [] } = useRows("member_fees");
  const upd = useUpdate("members");
  const m = members.find((x) => x.id === id);
  if (!m) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;

  const s = sav.filter((t) => t.member_id === id);
  const savBal = sum(s, (t) => (t.type === "withdraw" ? -t.amount : t.amount));
  const myLoans = loans.filter((l) => l.member_id === id);
  const myRep = rep.filter((r) => r.member_id === id);
  const loanDue = sum(myLoans.filter((l) => l.status === "active"), (l) => l.total_payable - sum(myRep.filter((r) => r.loan_id === l.id), (r) => r.amount));
  const d = dps.filter((t) => t.member_id === id);
  const dpsBal = sum(d, (t) => (t.type === "deposit" || t.type === "profit" ? t.amount : -t.amount));

  const ledger = [
    ...s.map((t) => ({ date: t.txn_date, desc: `সঞ্চয় ${typeLabel[t.type]}`, amt: t.amount, at: t.created_at })),
    ...myRep.map((t) => ({ date: t.txn_date, desc: "লোন কিস্তি", amt: Number(t.amount) + Number(t.late_fee), at: t.created_at })),
    ...d.map((t) => ({ date: t.txn_date, desc: `DPS ${typeLabel[t.type]}`, amt: t.amount, at: t.created_at })),
    ...fees.filter((f) => f.member_id === id).map((t) => ({ date: t.txn_date, desc: "সমিতি ফি", amt: t.amount, at: t.created_at })),
    ...myLoans.map((l) => ({ date: l.disburse_date, desc: `লোন প্রদান (${l.loan_no})`, amt: l.principal, at: l.created_at })),
  ].sort((a, b) => (b.date + b.at).localeCompare(a.date + a.at));

  const info: [string, string | null][] = [
    ["পিতা", m.father_name], ["মাতা", m.mother_name], ["স্বামী/স্ত্রী", m.spouse_name], ["মোবাইল", m.phone], ["NID", m.nid],
    ["জন্ম তারিখ", m.dob ? bnDate(m.dob) : null], ["পেশা", m.occupation], ["ঠিকানা", m.address], ["নমিনি", m.nominee_name ? `${m.nominee_name} (${m.nominee_relation ?? ""})` : null], ["ভর্তি", bnDate(m.admission_date)],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={m.name}
        subtitle={`সদস্য নং ${m.member_no}`}
        actions={<>
          <Button asChild variant="outline"><Link to="/members"><ArrowLeft className="size-4" /> তালিকা</Link></Button>
          <Button variant="outline" onClick={() => upd.mutate({ id, values: { status: m.status === "active" ? "inactive" : "active" } })}>{m.status === "active" ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}</Button>
          <Button onClick={() => window.print()}><Printer className="size-4" /> প্রিন্ট</Button>
        </>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="সঞ্চয় ব্যালেন্স" value={taka(savBal)} tone="success" />
        <StatCard label="অবশিষ্ট ঋণ" value={taka(loanDue)} tone="gold" />
        <StatCard label="DPS ব্যালেন্স" value={taka(dpsBal)} />
        <StatCard label="মোট লোন" value={myLoans.length} />
      </div>
      <Card className="grid gap-x-6 gap-y-2 p-5 shadow-card sm:grid-cols-2">
        {info.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-sm"><span className="w-28 shrink-0 text-muted-foreground">{k}</span><span>{v || "—"}</span></div>
        ))}
      </Card>
      <h2 className="text-lg font-semibold">লেনদেন খতিয়ান</h2>
      <DataTable head={["তারিখ", "বিবরণ", "টাকা"]} rows={ledger.map((l) => [bnDate(l.date), l.desc, taka(l.amt)])} />
    </div>
  );
}
