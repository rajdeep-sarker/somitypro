import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { useCenterRows } from "@/components/CenterScope";
import { pageHead } from "@/lib/metadata";
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
  head: () => pageHead("সমিতির রিপোর্ট"),
  component: Reports,
});

function Reports() {
  useLang();

  const today = todayISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const { data: settings = [] } = useCenterRows("somiti_settings", { order: "id" });
  const { data: members = [] } = useCenterRows("members", { order: "member_no", ascending: true });
  const { data: sav = [] } = useCenterRows("savings_transactions");
  const { data: loans = [] } = useCenterRows("loans");
  const { data: rep = [] } = useCenterRows("loan_repayments");
  const { data: dps = [] } = useCenterRows("dps_transactions");
  const { data: fdrA = [] } = useCenterRows("fdr_accounts");
  const { data: fdrT = [] } = useCenterRows("fdr_transactions");
  const { data: fees = [] } = useCenterRows("member_fees");
  const { data: cash = [] } = useCenterRows("cash_entries");

  const { data: ledgerAccounts = [] } = useCenterRows("ledger_accounts");
  const { data: ledgerTx = [] } = useCenterRows("ledger_transactions");
  const { data: salaries = [] } = useCenterRows("salary_payments");
  const accountMap = new Map(ledgerAccounts.map(a => [a.id, a]));
  const inR = <T extends { txn_date: string }>(r: T[]) => r.filter((x) => x.txn_date >= from && x.txn_date <= to);
  const upto = <T extends { txn_date: string }>(r: T[]) => r.filter((x) => x.txn_date <= to);

  function ledger(pick: <T extends { txn_date: string }>(r: T[]) => T[]) {
    const fdrOpen = fdrA.filter((a) => pick([{ txn_date: a.start_date }]).length);
    const loanOut = loans.filter((l) => pick([{ txn_date: l.disburse_date }]).length);
    const income: [string, number][] = [
      [uiText("প্রারম্ভিক ক্যাশ"), sum(pick(cash).filter((x) => x.kind === "opening"), (x) => x.amount)],
      [uiText("সঞ্চয় জমা"), sum(pick(sav).filter((x) => x.type === "deposit"), (x) => x.amount)],
      [uiText("লোন কিস্তি আদায়"), sum(pick(rep), (x) => x.amount)],
      [uiText("বিলম্ব চার্জ"), sum(pick(rep), (x) => x.late_fee)],
      [uiText("DPS জমা"), sum(pick(dps).filter((x) => x.type === "deposit"), (x) => x.amount)],
      [uiText("FDR জমা"), sum(fdrOpen, (a) => a.amount)],
      [uiText("সমিতি ফি / চার্জ"), sum(pick(fees), (x) => x.amount)],
      [uiText("শেয়ার ক্রয় / তহবিল জমা / বিনিয়োগ ফেরত"), sum(pick(ledgerTx).filter(t => ["purchase","deposit","return","profit"].includes(t.type) && accountMap.get(t.account_id)?.module !== "banks"), t => t.amount)],
      [uiText("ব্যাংক থেকে নগদ উত্তোলন"), sum(pick(ledgerTx).filter(t => t.type === "withdraw" && accountMap.get(t.account_id)?.module === "banks"), t => t.amount)],
      [uiText("অন্যান্য আয়"), sum(pick(cash).filter((x) => x.kind === "income"), (x) => x.amount)],
    ];
    const expense: [string, number][] = [
      [uiText("লোন প্রদান"), sum(loanOut, (l) => l.principal)],
      [uiText("সঞ্চয় উত্তোলন"), sum(pick(sav).filter((x) => x.type === "withdraw"), (x) => x.amount)],
      [uiText("DPS উত্তোলন"), sum(pick(dps).filter((x) => x.type === "withdraw" || x.type === "profit_withdraw"), (x) => x.amount)],
      [uiText("FDR উত্তোলন"), sum(pick(fdrT).filter((x) => x.type === "withdraw"), (x) => x.amount)],
      [uiText("FDR মুনাফা প্রদান"), sum(pick(fdrT).filter((x) => x.type === "profit"), (x) => x.amount)],
      [uiText("শেয়ার ফেরত / লভ্যাংশ / বিনিয়োগ / তহবিল খরচ"), sum(pick(ledgerTx).filter(t => ["withdraw","dividend","invest","expense"].includes(t.type) && accountMap.get(t.account_id)?.module !== "banks"), t => t.amount)],
      [uiText("ব্যাংকে নগদ জমা"), sum(pick(ledgerTx).filter(t => t.type === "deposit" && accountMap.get(t.account_id)?.module === "banks"), t => t.amount)],
      [uiText("কর্মীর বেতন"), sum(pick(salaries), t => t.amount)],
      [uiText("সমিতির খরচ"), sum(pick(cash).filter((x) => x.kind === "expense"), (x) => x.amount)],
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
    ...inR(sav).filter((x) => x.type === "deposit").map((x) => ({ d: x.txn_date, m: x.member_id, k: uiText("সঞ্চয়"), a: x.amount })),
    ...inR(rep).map((x) => ({ d: x.txn_date, m: x.member_id, k: uiText("লোন কিস্তি"), a: Number(x.amount) + Number(x.late_fee) })),
    ...inR(dps).filter((x) => x.type === "deposit").map((x) => ({ d: x.txn_date, m: x.member_id, k: "DPS", a: x.amount })),
    ...inR(fees).map((x) => ({ d: x.txn_date, m: x.member_id, k: uiText("ফি"), a: x.amount })),
  ].sort((a, b) => a.d.localeCompare(b.d));

  const Ledger = ({ l }: { l: ReturnType<typeof ledger> }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <DataTable head={[uiText("আয় / জমা"), uiText("টাকা")]} rows={l.income.map(([k, v]) => [k, taka(v)])} foot={[uiText("মোট"), taka(l.inT)]} />
      <DataTable head={[uiText("ব্যয় / প্রদান"), uiText("টাকা")]} rows={l.expense.map(([k, v]) => [k, taka(v)])} foot={[uiText("মোট"), taka(l.exT)]} />
      <div className="rounded-xl bg-hero p-5 text-primary-foreground md:col-span-2">
        <p className="text-sm opacity-80">{uiText("হাতে নগদ (জমা − প্রদান)")}</p>
        <p className="text-3xl font-semibold">{taka(l.inT - l.exT)}</p>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title={uiText("সমিতির রিপোর্ট")} subtitle={name} actions={<Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />  {uiText("প্রিন্ট")}</Button>} />
      <div className="no-print mb-4 flex flex-wrap gap-3">
        <Field label={uiText("শুরুর তারিখ")}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label={uiText("শেষ তারিখ")}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
      <Tabs defaultValue="daily">
        <TabsList className="no-print mb-4 flex-wrap">
          <TabsTrigger value="daily">{uiText("দৈনিক কালেকশন")}</TabsTrigger>
          <TabsTrigger value="settle">{uiText("তারিখভিত্তিক সেটেলমেন্ট")}</TabsTrigger>
          <TabsTrigger value="cash">{uiText("হাতে নগদ রিপোর্ট")}</TabsTrigger>
          <TabsTrigger value="balance">{uiText("সকল সদস্যের ব্যালেন্স")}</TabsTrigger>
          <TabsTrigger value="summary">{uiText("সমিতি সার সংক্ষেপ")}</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <p className="mb-2 text-sm text-muted-foreground">{bnDate(from)} — {bnDate(to)}</p>
          <DataTable head={[uiText("তারিখ"), uiText("সদস্য"), uiText("খাত"), uiText("টাকা")]} rows={coll.map((c) => [bnDate(c.d), mName.get(c.m), c.k, taka(c.a)])} foot={[uiText("মোট কালেকশন"), "", "", taka(sum(coll, (c) => c.a))]} />
        </TabsContent>
        <TabsContent value="settle"><Ledger l={period} /></TabsContent>
        <TabsContent value="cash">
          <p className="mb-2 text-sm text-muted-foreground">{uiText("শুরু থেকে")} {bnDate(to)}  {uiText("পর্যন্ত")}</p>
          <Ledger l={total} />
        </TabsContent>
        <TabsContent value="balance">
          <DataTable
            head={[uiText("সদস্য নং"), uiText("নাম"), uiText("সঞ্চয়"), "DPS", "FDR", uiText("অবশিষ্ট ঋণ")]}
            rows={members.map((m) => [m.member_no, m.name, taka(savBal(m.id)), taka(dpsBal(m.id)), taka(fdrBal(m.id)), taka(loanRem(m.id))])}
            foot={[uiText("মোট"), "", taka(sum(members, (m) => savBal(m.id))), taka(sum(members, (m) => dpsBal(m.id))), taka(sum(members, (m) => fdrBal(m.id))), taka(sum(members, (m) => loanRem(m.id)))]}
          />
        </TabsContent>
        <TabsContent value="summary">
          <DataTable
            head={[uiText("বিষয়"), uiText("পরিমাণ")]}
            rows={[
              [uiText("মোট সদস্য"), members.length],
              [uiText("মোট সঞ্চয় স্থিতি"), taka(sum(members, (m) => savBal(m.id)))],
              [uiText("মোট বিতরণকৃত লোন"), taka(sum(loans, (l) => l.principal))],
              [uiText("মোট লোন আদায়"), taka(sum(rep, (r) => r.amount))],
              [uiText("অবশিষ্ট ঋণ"), taka(sum(members, (m) => loanRem(m.id)))],
              [uiText("DPS স্থিতি"), taka(sum(members, (m) => dpsBal(m.id)))],
              [uiText("FDR স্থিতি"), taka(sum(members, (m) => fdrBal(m.id)))],
              [uiText("মোট ফি আদায়"), taka(sum(fees, (f) => f.amount))],
              [uiText("মোট খরচ"), taka(sum(cash.filter((c) => c.kind === "expense"), (c) => c.amount))],
              [uiText("হাতে নগদ"), taka(total.inT - total.exT)],
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
