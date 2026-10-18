import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Field, PageHeader } from "@/components/kit";
import { useRows } from "@/lib/db";
import { bnDate, sum, taka, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "সমিতির রিপোর্ট — সোনালী সমিতি" }] }),
  component: Reports,
});

function Reports() {
  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const { data: settings = [] } = useRows("somiti_settings", { order: "id" });
  const { data: members = [] } = useRows("members", { order: "member_no", ascending: true });
  const { data: sav = [] } = useRows("savings_transactions");
  const { data: loans = [] } = useRows("loans");
  const { data: rep = [] } = useRows("loan_repayments");
  const { data: dps = [] } = useRows("dps_transactions");
  const { data: fdrA = [] } = useRows("fdr_accounts");
  const { data: fdrT = [] } = useRows("fdr_transactions");
  const { data: fees = [] } = useRows("member_fees");
  const { data: cash = [] } = useRows("cash_entries");

  const inR = <T extends { txn_date: string }>(r: T[]) => r.filter((x) => x.txn_date >= from && x.txn_date <= to);
  const upto = <T extends { txn_date: string }>(r: T[]) => r.filter((x) => x.txn_date <= to);

  function ledger(pick: <T extends { txn_date: string }>(r: T[]) => T[]) {
    const fdrOpen = fdrA.filter((a) => pick([{ txn_date: a.start_date }]).length);
    const loanOut = loans.filter((l) => pick([{ txn_date: l.disburse_date }]).length);
    const income: [string, number][] = [
      ["প্রারম্ভিক ক্যাশ", sum(pick(cash).filter((x) => x.kind === "opening"), (x) => x.amount)],
      ["সঞ্চয় জমা", sum(pick(sav).filter((x) => x.type === "deposit"), (x) => x.amount)],
      ["লোন কিস্তি আদায়", sum(pick(rep), (x) => x.amount)],
      ["বিলম্ব চার্জ", sum(pick(rep), (x) => x.late_fee)],
      ["DPS জমা", sum(pick(dps).filter((x) => x.type === "deposit"), (x) => x.amount)],
      ["FDR জমা", sum(fdrOpen, (a) => a.amount)],
      ["সমিতি ফি / চার্জ", sum(pick(fees), (x) => x.amount)],
      ["অন্যান্য আয়", sum(pick(cash).filter((x) => x.kind === "income"), (x) => x.amount)],
    ];
    const expense: [string, number][] = [
      ["লোন প্রদান", sum(loanOut, (l) => l.principal)],
      ["সঞ্চয় উত্তোলন", sum(pick(sav).filter((x) => x.type === "withdraw"), (x) => x.amount)],
      ["DPS উত্তোলন", sum(pick(dps).filter((x) => x.type === "withdraw" || x.type === "profit_withdraw"), (x) => x.amount)],
      ["FDR উত্তোলন", sum(pick(fdrT).filter((x) => x.type === "withdraw"), (x) => x.amount)],
      ["FDR মুনাফা প্রদান", sum(pick(fdrT).filter((x) => x.type === "profit"), (x) => x.amount)],
      ["সমিতির খরচ", sum(pick(cash).filter((x) => x.kind === "expense"), (x) => x.amount)],
    ];
    return { income, expense, inT: sum(income, (x) => x[1]), exT: sum(expense, (x) => x[1]) };
  }

  const period = ledger(inR);
  const total = ledger(upto);
  const name = settings[0]?.name ?? "";
  const savBal = (id: string) => sum(sav.filter((t) => t.member_id === id), (t) => (t.type === "withdraw" ? -t.amount : t.amount));
  const loanRem = (id: string) => sum(loans.filter((l) => l.member_id === id && l.status === "active"), (l) => l.total_payable - sum(rep.filter((r) => r.loan_id === l.id), (r) => r.amount));
  const dpsBal = (id: string) => sum(dps.filter((t) => t.member_id === id), (t) => (t.type === "deposit" || t.type === "profit" ? t.amount : -t.amount));
  const fdrBal = (id: string) => sum(fdrA.filter((a) => a.member_id === id && a.status === "active"), (a) => a.amount);

  const mName = new Map(members.map((m) => [m.id, `${m.member_no} ${m.name}`]));
  const coll = [
    ...inR(sav).filter((x) => x.type === "deposit").map((x) => ({ d: x.txn_date, m: x.member_id, k: "সঞ্চয়", a: x.amount })),
    ...inR(rep).map((x) => ({ d: x.txn_date, m: x.member_id, k: "লোন কিস্তি", a: Number(x.amount) + Number(x.late_fee) })),
    ...inR(dps).filter((x) => x.type === "deposit").map((x) => ({ d: x.txn_date, m: x.member_id, k: "DPS", a: x.amount })),
    ...inR(fees).map((x) => ({ d: x.txn_date, m: x.member_id, k: "ফি", a: x.amount })),
  ].sort((a, b) => a.d.localeCompare(b.d));

  const Ledger = ({ l }: { l: ReturnType<typeof ledger> }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <DataTable head={["আয় / জমা", "টাকা"]} rows={l.income.map(([k, v]) => [k, taka(v)])} foot={["মোট", taka(l.inT)]} />
      <DataTable head={["ব্যয় / প্রদান", "টাকা"]} rows={l.expense.map(([k, v]) => [k, taka(v)])} foot={["মোট", taka(l.exT)]} />
      <div className="rounded-xl bg-hero p-5 text-primary-foreground md:col-span-2">
        <p className="text-sm opacity-80">হাতে নগদ (জমা − প্রদান)</p>
        <p className="text-3xl font-semibold">{taka(l.inT - l.exT)}</p>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="সমিতির রিপোর্ট" subtitle={name} actions={<Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> প্রিন্ট</Button>} />
      <div className="no-print mb-4 flex flex-wrap gap-3">
        <Field label="শুরুর তারিখ"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="শেষ তারিখ"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
      <Tabs defaultValue="daily">
        <TabsList className="no-print mb-4 flex-wrap">
          <TabsTrigger value="daily">দৈনিক কালেকশন</TabsTrigger>
          <TabsTrigger value="settle">তারিখভিত্তিক সেটেলমেন্ট</TabsTrigger>
          <TabsTrigger value="cash">হাতে নগদ রিপোর্ট</TabsTrigger>
          <TabsTrigger value="balance">সকল সদস্যের ব্যালেন্স</TabsTrigger>
          <TabsTrigger value="summary">সমিতি সার সংক্ষেপ</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <p className="mb-2 text-sm text-muted-foreground">{bnDate(from)} — {bnDate(to)}</p>
          <DataTable head={["তারিখ", "সদস্য", "খাত", "টাকা"]} rows={coll.map((c) => [bnDate(c.d), mName.get(c.m), c.k, taka(c.a)])} foot={["মোট কালেকশন", "", "", taka(sum(coll, (c) => c.a))]} />
        </TabsContent>
        <TabsContent value="settle"><Ledger l={period} /></TabsContent>
        <TabsContent value="cash">
          <p className="mb-2 text-sm text-muted-foreground">শুরু থেকে {bnDate(to)} পর্যন্ত</p>
          <Ledger l={total} />
        </TabsContent>
        <TabsContent value="balance">
          <DataTable
            head={["সদস্য নং", "নাম", "সঞ্চয়", "DPS", "FDR", "অবশিষ্ট ঋণ"]}
            rows={members.map((m) => [m.member_no, m.name, taka(savBal(m.id)), taka(dpsBal(m.id)), taka(fdrBal(m.id)), taka(loanRem(m.id))])}
            foot={["মোট", "", taka(sum(members, (m) => savBal(m.id))), taka(sum(members, (m) => dpsBal(m.id))), taka(sum(members, (m) => fdrBal(m.id))), taka(sum(members, (m) => loanRem(m.id)))]}
          />
        </TabsContent>
        <TabsContent value="summary">
          <DataTable
            head={["বিষয়", "পরিমাণ"]}
            rows={[
              ["মোট সদস্য", members.length],
              ["মোট সঞ্চয় স্থিতি", taka(sum(members, (m) => savBal(m.id)))],
              ["মোট বিতরণকৃত লোন", taka(sum(loans, (l) => l.principal))],
              ["মোট লোন আদায়", taka(sum(rep, (r) => r.amount))],
              ["অবশিষ্ট ঋণ", taka(sum(members, (m) => loanRem(m.id)))],
              ["DPS স্থিতি", taka(sum(members, (m) => dpsBal(m.id)))],
              ["FDR স্থিতি", taka(sum(members, (m) => fdrBal(m.id)))],
              ["মোট ফি আদায়", taka(sum(fees, (f) => f.amount))],
              ["মোট খরচ", taka(sum(cash.filter((c) => c.kind === "expense"), (c) => c.amount))],
              ["হাতে নগদ", taka(total.inT - total.exT)],
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
