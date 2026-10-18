import { pageHead } from "@/lib/metadata";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Field, FormCard, MemberSelect, PageHeader, SimpleSelect, useMemberMap } from "@/components/kit";
import { nextNo, useInsert, useRows, useUpdate } from "@/lib/db";
import { bn, bnDate, sum, taka, todayISO } from "@/lib/format";
import { addPeriods, simpleProfit } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/fdr")({
  head: () => pageHead("FDR ব্যবস্থাপনা"),
  component: Fdr,
});

const tLabel = { deposit: "জমা", withdraw: "উত্তোলন", profit: "মুনাফা প্রদান", service_charge: "সার্ভিস চার্জ কর্তন" } as Record<string, string> & { profit: string; service_charge: string };
const payout: Record<string, string> = { maturity: "মেয়াদ শেষে", monthly: "মাসিক" };

function Fdr() {
  const today = todayISO();
  const { data: schemes = [] } = useRows("fdr_schemes");
  const { data: accounts = [] } = useRows("fdr_accounts");
  const { data: tx = [] } = useRows("fdr_transactions");
  const mm = useMemberMap();
  const insScheme = useInsert("fdr_schemes");
  const insAcc = useInsert("fdr_accounts", "FDR খোলা হয়েছে");
  const updAcc = useUpdate("fdr_accounts");
  const insTx = useInsert("fdr_transactions");
  const sMap = new Map(schemes.map((s) => [s.id, s]));
  const aMap = new Map(accounts.map((a) => [a.id, a]));

  const [sc, setSc] = useState({ name: "", duration_months: "12", profit_rate: "10", payout_type: "maturity" });
  const [ac, setAc] = useState({ member_id: "", scheme_id: "", amount: "", start_date: today });
  const [t, setT] = useState({ account_id: "", type: "profit", amount: "", txn_date: today, note: "" });
  const [calc, setCalc] = useState({ a: "100000", r: "10", m: "12" });
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  function openAcc() {
    const s = sMap.get(ac.scheme_id);
    if (!s || !ac.member_id) return;
    const account_no = nextNo("FDR-", accounts.map((a) => a.account_no));
    insAcc.mutate({ account_no, member_id: ac.member_id, scheme_id: s.id, amount: Number(ac.amount), start_date: ac.start_date, maturity_date: addPeriods(ac.start_date, "monthly", s.duration_months) }, { onSuccess: () => setAc({ ...ac, member_id: "", amount: "" }) });
  }

  const paidProfit = (id: string) => sum(tx.filter((x) => x.account_id === id && x.type === "profit"), (x) => x.amount);
  const rng = tx.filter((x) => x.txn_date >= from && x.txn_date <= to);

  return (
    <div>
      <PageHeader title="FDR ব্যবস্থাপনা" subtitle={`মোট আমানত ${taka(sum(accounts.filter((a) => a.status === "active"), (a) => a.amount))}`} />
      <Tabs defaultValue="accounts">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="accounts">সকল FDR</TabsTrigger>
          <TabsTrigger value="open">FDR সেটিং ও কালেকশন</TabsTrigger>
          <TabsTrigger value="profit">মুনাফা প্রদান / উত্তোলন</TabsTrigger>
          <TabsTrigger value="report">জমা-উত্তোলন রিপোর্ট</TabsTrigger>
          <TabsTrigger value="schemes">স্কিম তৈরি</TabsTrigger>
          <TabsTrigger value="calc">ক্যালকুলেটর</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">
          <DataTable
            head={["একাউন্ট নং", "সদস্য", "স্কিম", "আমানত", "শুরু", "মেয়াদপূর্তি", "প্রত্যাশিত মুনাফা", "প্রদত্ত মুনাফা", ""]}
            rows={accounts.map((a) => {
              const s = sMap.get(a.scheme_id ?? "");
              return [
                a.account_no, mm.get(a.member_id)?.name, s?.name, taka(a.amount), bnDate(a.start_date), bnDate(a.maturity_date),
                taka(s ? simpleProfit(a.amount, s.profit_rate, s.duration_months) : 0), taka(paidProfit(a.id)),
                a.status === "active" ? <Button key="c" size="sm" variant="ghost" onClick={() => {
                  if (!confirm("FDR নগদায়ন (উত্তোলন) করবেন?")) return;
                  insTx.mutate({ account_id: a.id, member_id: a.member_id, type: "withdraw", amount: a.amount, txn_date: today, note: "FDR নগদায়ন" });
                  updAcc.mutate({ id: a.id, values: { status: "closed" } });
                }}>নগদায়ন</Button> : "বন্ধ",
              ];
            })}
          />
        </TabsContent>
        <TabsContent value="open">
          <FormCard title="নতুন FDR জমা" onSubmit={openAcc}>
            <Field label="সদস্য"><MemberSelect value={ac.member_id} onChange={(v) => setAc({ ...ac, member_id: v })} /></Field>
            <Field label="স্কিম"><SimpleSelect value={ac.scheme_id} onChange={(v) => setAc({ ...ac, scheme_id: v })} options={schemes.filter((s) => s.active).map((s) => ({ value: s.id, label: `${s.name} (${s.profit_rate}%, ${s.duration_months} মাস)` }))} /></Field>
            <Field label="আমানতের পরিমাণ"><Input type="number" min={1} required value={ac.amount} onChange={(e) => setAc({ ...ac, amount: e.target.value })} /></Field>
            <Field label="তারিখ"><Input type="date" value={ac.start_date} onChange={(e) => setAc({ ...ac, start_date: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Button type="submit" disabled={!ac.member_id || !ac.scheme_id}>FDR খুলুন</Button></div>
          </FormCard>
        </TabsContent>
        <TabsContent value="profit">
          <FormCard title="FDR মুনাফা প্রদান / সার্ভিস চার্জ" onSubmit={() => {
            const a = aMap.get(t.account_id);
            if (!a) return;
            insTx.mutate({ account_id: a.id, member_id: a.member_id, type: t.type, amount: Number(t.amount), txn_date: t.txn_date, note: t.note }, { onSuccess: () => setT({ ...t, amount: "", note: "" }) });
          }}>
            <Field label="FDR একাউন্ট"><SimpleSelect value={t.account_id} onChange={(v) => setT({ ...t, account_id: v })} options={accounts.filter((a) => a.status === "active").map((a) => ({ value: a.id, label: `${a.account_no} — ${mm.get(a.member_id)?.name ?? ""}` }))} /></Field>
            <Field label="ধরন"><SimpleSelect value={t.type} onChange={(v) => setT({ ...t, type: v })} options={[{ value: "profit", label: tLabel.profit }, { value: "service_charge", label: tLabel.service_charge }]} /></Field>
            <Field label="টাকা"><Input type="number" min={1} required value={t.amount} onChange={(e) => setT({ ...t, amount: e.target.value })} /></Field>
            <Field label="তারিখ"><Input type="date" value={t.txn_date} onChange={(e) => setT({ ...t, txn_date: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Button type="submit" disabled={!t.account_id}>সংরক্ষণ করুন</Button></div>
          </FormCard>
        </TabsContent>
        <TabsContent value="report" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Field label="শুরু"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="শেষ"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          <DataTable
            head={["তারিখ", "একাউন্ট", "সদস্য", "ধরন", "টাকা"]}
            rows={[
              ...accounts.filter((a) => a.start_date >= from && a.start_date <= to).map((a) => [bnDate(a.start_date), a.account_no, mm.get(a.member_id)?.name, "নতুন জমা", taka(a.amount)]),
              ...rng.map((x) => [bnDate(x.txn_date), aMap.get(x.account_id)?.account_no, mm.get(x.member_id)?.name, tLabel[x.type], taka(x.amount)]),
            ]}
          />
        </TabsContent>
        <TabsContent value="schemes" className="space-y-4">
          <FormCard title="FDR স্কিম তৈরি" onSubmit={() => insScheme.mutate({ ...sc, duration_months: Number(sc.duration_months), profit_rate: Number(sc.profit_rate) }, { onSuccess: () => setSc({ ...sc, name: "" }) })}>
            <Field label="স্কিমের নাম"><Input required value={sc.name} onChange={(e) => setSc({ ...sc, name: e.target.value })} /></Field>
            <Field label="মুনাফা প্রদানের ধরন"><SimpleSelect value={sc.payout_type} onChange={(v) => setSc({ ...sc, payout_type: v })} options={Object.entries(payout).map(([value, label]) => ({ value, label }))} /></Field>
            <Field label="মেয়াদ (মাস)"><Input type="number" value={sc.duration_months} onChange={(e) => setSc({ ...sc, duration_months: e.target.value })} /></Field>
            <Field label="মুনাফা (%)"><Input type="number" step="0.01" value={sc.profit_rate} onChange={(e) => setSc({ ...sc, profit_rate: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Button type="submit">স্কিম তৈরি করুন</Button></div>
          </FormCard>
          <DataTable head={["স্কিমের নাম", "ধরন", "সময়কাল", "লভ্যাংশ (%)"]} rows={schemes.map((s) => [s.name, payout[s.payout_type], `${bn(s.duration_months)} মাস`, `${bn(s.profit_rate)}%`])} />
        </TabsContent>
        <TabsContent value="calc">
          <FormCard title="FDR ক্যালকুলেটর" onSubmit={() => {}}>
            <Field label="আমানত"><Input type="number" value={calc.a} onChange={(e) => setCalc({ ...calc, a: e.target.value })} /></Field>
            <Field label="বার্ষিক হার (%)"><Input type="number" value={calc.r} onChange={(e) => setCalc({ ...calc, r: e.target.value })} /></Field>
            <Field label="মেয়াদ (মাস)"><Input type="number" value={calc.m} onChange={(e) => setCalc({ ...calc, m: e.target.value })} /></Field>
            <div className="rounded-lg bg-secondary p-4 text-sm">
              মোট মুনাফা: <b>{taka(simpleProfit(Number(calc.a), Number(calc.r), Number(calc.m)))}</b><br />
              মাসিক মুনাফা: <b>{taka(simpleProfit(Number(calc.a), Number(calc.r), 1))}</b>
            </div>
          </FormCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
