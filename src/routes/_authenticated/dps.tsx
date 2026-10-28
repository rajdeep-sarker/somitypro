import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { useCenterRows } from "@/components/CenterScope";
import { EditEntry } from "@/components/EditEntry";
import { pageHead } from "@/lib/metadata";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Field, FormCard, MemberSelect, PageHeader, SimpleSelect, useMemberMap } from "@/components/kit";
import { nextNo, useInsert, useRows, useUpdate } from "@/lib/db";
import { bn, bnDate, sum, taka, todayISO } from "@/lib/format";
import { addPeriods, dpsMaturity, installmentLabels, isDueOn, type InstallmentType } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/dps")({
  head: () => pageHead("DPS ব্যবস্থাপনা"),
  component: Dps,
});

const tLabel: Record<string, string> = { deposit: "কিস্তি জমা", withdraw: "মূল আমানত উত্তোলন", profit: "লভ্যাংশ যোগ", profit_withdraw: "লভ্যাংশ উত্তোলন", service_charge: "সার্ভিস চার্জ কর্তন" };
const typeOpts = (Object.keys(installmentLabels) as InstallmentType[]).map((k) => ({ value: k, label: installmentLabels[k] }));

function Dps() {
  useLang();

  const { data: allAccounts = [] } = useRows("dps_accounts");
  const today = todayISO();
  const { data: schemes = [] } = useCenterRows("dps_schemes");
  const { data: accounts = [] } = useCenterRows("dps_accounts");
  const { data: tx = [] } = useCenterRows("dps_transactions");
  const mm = useMemberMap();
  const insScheme = useInsert("dps_schemes");
  const updScheme = useUpdate("dps_schemes");
  const insAcc = useInsert("dps_accounts", uiText("DPS একাউন্ট খোলা হয়েছে"));
  const updAcc = useUpdate("dps_accounts");
  const insTx = useInsert("dps_transactions");

  const [sc, setSc] = useState({ name: "", installment_type: "monthly", duration_months: "12", profit_rate: "8" });
  const [ac, setAc] = useState({ member_id: "", scheme_id: "", installment_amount: "", start_date: today });
  const [t, setT] = useState({ account_id: "", type: "deposit", amount: "", txn_date: today, note: "" });
  const [calc, setCalc] = useState({ d: "1000", r: "10", m: "12" });
  const [day, setDay] = useState(today);

  const sMap = new Map(schemes.map((s) => [s.id, s]));
  const aMap = new Map(accounts.map((a) => [a.id, a]));
  const accTx = (id: string) => tx.filter((x) => x.account_id === id);
  const deposit = (id: string) => sum(accTx(id).filter((x) => x.type === "deposit"), (x) => x.amount) - sum(accTx(id).filter((x) => x.type === "withdraw" || x.type === "service_charge"), (x) => x.amount);
  const profit = (id: string) => sum(accTx(id).filter((x) => x.type === "profit"), (x) => x.amount) - sum(accTx(id).filter((x) => x.type === "profit_withdraw"), (x) => x.amount);

  const dueToday = accounts.filter((a) => {
    const s = sMap.get(a.scheme_id ?? "");
    if (a.status !== "active" || !s) return false;
    const type = s.installment_type as InstallmentType;
    const count = type === "monthly" ? s.duration_months : type === "weekly" ? Math.round(s.duration_months * 4.33) : s.duration_months * 30;
    return isDueOn(addPeriods(a.start_date, type, 0), type, count, today);
  });

  const cr = dpsMaturity(Number(calc.d), Number(calc.r), Number(calc.m));
  const dayTx = tx.filter((x) => x.txn_date === day);

  return (
    <div>
      <PageHeader title={uiText("DPS ব্যবস্থাপনা")} subtitle={`সক্রিয় DPS ${bn(accounts.filter((a) => a.status === "active").length)} টি`} />
      <Tabs defaultValue="accounts">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="accounts">{uiText("DPS ব্যবস্থাপনা")}</TabsTrigger>
          <TabsTrigger value="collect">{uiText("DPS কালেকশন")}</TabsTrigger>
          <TabsTrigger value="open">{uiText("নতুন DPS")}</TabsTrigger>
          <TabsTrigger value="report">{uiText("দৈনিক রিপোর্ট")}</TabsTrigger>
          <TabsTrigger value="due">{uiText("আজকের কিস্তি (")}{bn(dueToday.length)})</TabsTrigger>
          <TabsTrigger value="schemes">{uiText("স্কিম সেটিং")}</TabsTrigger>
          <TabsTrigger value="calc">{uiText("ক্যালকুলেটর")}</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <DataTable
            head={[uiText("একাউন্ট নং"), uiText("সদস্য"), uiText("স্কিম"), uiText("কিস্তি"), uiText("শুরু"), uiText("মূল জমা"), uiText("লভ্যাংশ"), uiText("ব্যালেন্স"), "", ""]}
            rows={accounts.map((a) => [
              a.account_no, `${mm.get(a.member_id)?.name ?? ""} (${mm.get(a.member_id)?.member_no ?? ""})`, sMap.get(a.scheme_id ?? "")?.name, taka(a.installment_amount), bnDate(a.start_date),
              taka(deposit(a.id)), taka(profit(a.id)), <b key="b">{taka(deposit(a.id) + profit(a.id))}</b>,
              <EditEntry key="e" table="dps_accounts" row={a} />,
              a.status === "active" ? <Button key="c" size="sm" variant="ghost" onClick={() => confirm(uiText("DPS বন্ধ করবেন?")) && updAcc.mutate({ id: a.id, values: { status: "closed" } })}>{uiText("বন্ধ")}</Button> : uiText("বন্ধ"),
            ])}
          />
        </TabsContent>

        <TabsContent value="collect">
          <FormCard title={uiText("DPS কালেকশন / উত্তোলন")} onSubmit={() => {
            const a = aMap.get(t.account_id);
            if (!a) return;
            insTx.mutate({ account_id: a.id, member_id: a.member_id, type: t.type, amount: Number(t.amount), txn_date: t.txn_date, note: t.note }, { onSuccess: () => setT({ ...t, account_id: "", amount: "", note: "" }) });
          }}>
            <Field label={uiText("DPS একাউন্ট")}>
              <SimpleSelect value={t.account_id} onChange={(v) => setT({ ...t, account_id: v, amount: String(aMap.get(v)?.installment_amount ?? "") })} options={accounts.filter((a) => a.status === "active").map((a) => ({ value: a.id, label: `${a.account_no} — ${mm.get(a.member_id)?.name ?? ""}` }))} />
            </Field>
            <Field label={uiText("ধরন")}><SimpleSelect value={t.type} onChange={(v) => setT({ ...t, type: v })} options={Object.entries(tLabel).map(([value, label]) => ({ value, label }))} /></Field>
            <Field label={uiText("টাকা")}><Input type="number" min={1} required value={t.amount} onChange={(e) => setT({ ...t, amount: e.target.value })} /></Field>
            <Field label={uiText("তারিখ")}><Input type="date" value={t.txn_date} onChange={(e) => setT({ ...t, txn_date: e.target.value })} /></Field>
            {t.account_id && <p className="text-sm text-muted-foreground sm:col-span-2">{uiText("মূল জমা")} {taka(deposit(t.account_id))}  {uiText("· লভ্যাংশ")} {taka(profit(t.account_id))}</p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={!t.account_id}>{uiText("সংরক্ষণ করুন")}</Button></div>
          </FormCard>
        </TabsContent>

        <TabsContent value="open">
          <FormCard title={uiText("নতুন DPS একাউন্ট")} onSubmit={() => insAcc.mutate({ ...ac, installment_amount: Number(ac.installment_amount), account_no: nextNo("DPS-", allAccounts.map((a) => a.account_no)) }, { onSuccess: () => setAc({ ...ac, member_id: "", installment_amount: "" }) })}>
            <Field label={uiText("সদস্য")}><MemberSelect value={ac.member_id} onChange={(v) => setAc({ ...ac, member_id: v })} /></Field>
            <Field label={uiText("স্কিম")}><SimpleSelect value={ac.scheme_id} onChange={(v) => setAc({ ...ac, scheme_id: v })} options={schemes.filter((s) => s.active).map((s) => ({ value: s.id, label: `${s.name} (${s.profit_rate}%)` }))} /></Field>
            <Field label={uiText("কিস্তির টাকা")}><Input type="number" min={1} required value={ac.installment_amount} onChange={(e) => setAc({ ...ac, installment_amount: e.target.value })} /></Field>
            <Field label={uiText("শুরুর তারিখ")}><Input type="date" value={ac.start_date} onChange={(e) => setAc({ ...ac, start_date: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Button type="submit" disabled={!ac.member_id || !ac.scheme_id}>{uiText("DPS খুলুন")}</Button></div>
          </FormCard>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Field label={uiText("তারিখ")} className="max-w-xs"><Input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></Field>
          <DataTable
            head={[uiText("একাউন্ট"), uiText("সদস্য"), uiText("ধরন"), uiText("টাকা"), uiText("মন্তব্য"), ""]}
            rows={dayTx.map((x) => [aMap.get(x.account_id)?.account_no, mm.get(x.member_id)?.name, tLabel[x.type], taka(x.amount), x.note, <EditEntry key="e" table="dps_transactions" row={x} />])}
            foot={[uiText("মোট কালেকশন"), "", "", taka(sum(dayTx.filter((x) => x.type === "deposit"), (x) => x.amount)), ""]}
          />
        </TabsContent>

        <TabsContent value="due">
          <DataTable head={[uiText("একাউন্ট"), uiText("সদস্য"), uiText("মোবাইল"), uiText("কিস্তি")]} rows={dueToday.map((a) => [a.account_no, mm.get(a.member_id)?.name, mm.get(a.member_id)?.phone, taka(a.installment_amount)])} />
        </TabsContent>

        <TabsContent value="schemes" className="space-y-4">
          <FormCard title={uiText("DPS স্কিম তৈরি")} onSubmit={() => insScheme.mutate({ ...sc, duration_months: Number(sc.duration_months), profit_rate: Number(sc.profit_rate) }, { onSuccess: () => setSc({ ...sc, name: "" }) })}>
            <Field label={uiText("স্কিমের নাম")}><Input required value={sc.name} onChange={(e) => setSc({ ...sc, name: e.target.value })} /></Field>
            <Field label={uiText("কিস্তির ধরন")}><SimpleSelect value={sc.installment_type} onChange={(v) => setSc({ ...sc, installment_type: v })} options={typeOpts} /></Field>
            <Field label={uiText("মেয়াদ (মাস)")}><Input type="number" value={sc.duration_months} onChange={(e) => setSc({ ...sc, duration_months: e.target.value })} /></Field>
            <Field label={uiText("লভ্যাংশ (%)")}><Input type="number" step="0.01" value={sc.profit_rate} onChange={(e) => setSc({ ...sc, profit_rate: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Button type="submit">{uiText("স্কিম তৈরি করুন")}</Button></div>
          </FormCard>
          <DataTable
            head={[uiText("স্কিমের নাম"), uiText("ধরন"), uiText("মেয়াদ"), uiText("লভ্যাংশ"), uiText("অবস্থা"), ""]}
            rows={schemes.map((s) => [s.name, installmentLabels[s.installment_type as InstallmentType], `${bn(s.duration_months)} মাস`, `${bn(s.profit_rate)}%`, <Button key="t" size="sm" variant="outline" onClick={() => updScheme.mutate({ id: s.id, values: { active: !s.active } })}>{s.active ? uiText("সক্রিয়") : uiText("নিষ্ক্রিয়")}</Button>, <EditEntry key="e" table="dps_schemes" row={s} />])}
          />
        </TabsContent>

        <TabsContent value="calc">
          <FormCard title={uiText("DPS ক্যালকুলেটর (মাসিক)")} onSubmit={() => {}}>
            <Field label={uiText("মাসিক কিস্তি")}><Input type="number" value={calc.d} onChange={(e) => setCalc({ ...calc, d: e.target.value })} /></Field>
            <Field label={uiText("বার্ষিক হার (%)")}><Input type="number" value={calc.r} onChange={(e) => setCalc({ ...calc, r: e.target.value })} /></Field>
            <Field label={uiText("মেয়াদ (মাস)")}><Input type="number" value={calc.m} onChange={(e) => setCalc({ ...calc, m: e.target.value })} /></Field>
            <div className="rounded-lg bg-secondary p-4 text-sm">{uiText("মূল জমা:")} <b>{taka(cr.principal)}</b><br />{uiText("লভ্যাংশ:")} <b>{taka(cr.profit)}</b><br />{uiText("মেয়াদ শেষে:")} <b>{taka(cr.total)}</b></div>
          </FormCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
