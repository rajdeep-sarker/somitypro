import { EditEntry } from "@/components/EditEntry";
import { pageHead } from "@/lib/metadata";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Field, FormCard, MemberSelect, PageHeader, SimpleSelect, useMemberMap } from "@/components/kit";
import { useInsert, useRows } from "@/lib/db";
import { bnDate, sum, taka, todayISO } from "@/lib/format";
import { simpleProfit } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/savings")({
  head: () => pageHead("সঞ্চয় ব্যবস্থাপনা"),
  component: Savings,
});

const label: Record<string, string> = { deposit: "জমা", withdraw: "উত্তোলন", profit: "লভ্যাংশ" };

function Savings() {
  const { data: tx = [] } = useRows("savings_transactions");
  const { data: members = [] } = useRows("members", { order: "member_no", ascending: true });
  const mm = useMemberMap();
  const ins = useInsert("savings_transactions");
  const [f, setF] = useState({ member_id: "", type: "deposit", amount: "", txn_date: todayISO(), note: "" });
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [rate, setRate] = useState({ amount: "10000", rate: "8", months: "12" });
  const [pr, setPr] = useState({ rate: "5", date: todayISO() });

  const bal = (id: string) => sum(tx.filter((t) => t.member_id === id), (t) => (t.type === "withdraw" ? -t.amount : t.amount));
  const filtered = tx.filter((t) => t.txn_date >= from && t.txn_date <= to);

  function save() {
    if (!f.member_id) return;
    if (f.type === "withdraw" && Number(f.amount) > bal(f.member_id)) return alert("ব্যালেন্সের চেয়ে বেশি উত্তোলন সম্ভব নয়");
    ins.mutate({ ...f, type: f.type, amount: Number(f.amount) }, { onSuccess: () => setF({ ...f, amount: "", note: "" }) });
  }

  function distributeProfit() {
    const rows = members.map((m) => ({ m, b: bal(m.id) })).filter((x) => x.b > 0).map((x) => ({ member_id: x.m.id, type: "profit", amount: Math.round((x.b * Number(pr.rate)) / 100), txn_date: pr.date, note: `লভ্যাংশ ${pr.rate}%` })).filter((r) => r.amount > 0);
    if (!rows.length) return alert("ব্যালেন্স সহ কোনো সদস্য নেই");
    if (confirm(`${rows.length} জন সদস্যকে মোট ${taka(sum(rows, (r) => r.amount))} লভ্যাংশ দেয়া হবে। নিশ্চিত?`)) ins.mutate(rows);
  }

  const c = simpleProfit(Number(rate.amount), Number(rate.rate), Number(rate.months));

  return (
    <div>
      <PageHeader title="সঞ্চয় ব্যবস্থাপনা" subtitle={`মোট সঞ্চয় ব্যালেন্স ${taka(sum(tx, (t) => (t.type === "withdraw" ? -t.amount : t.amount)))}`} />
      <Tabs defaultValue="collect">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="collect">কিস্তি কালেকশন</TabsTrigger>
          <TabsTrigger value="list">সকল কালেকশন</TabsTrigger>
          <TabsTrigger value="balance">সদস্যের ব্যালেন্স</TabsTrigger>
          <TabsTrigger value="profit">লভ্যাংশ সেট</TabsTrigger>
          <TabsTrigger value="calc">লাভ ক্যালকুলেটর</TabsTrigger>
        </TabsList>
        <TabsContent value="collect">
          <FormCard title="সঞ্চয় জমা / উত্তোলন" onSubmit={save}>
            <Field label="সদস্য"><MemberSelect value={f.member_id} onChange={(v) => setF({ ...f, member_id: v })} /></Field>
            <Field label="ধরন"><SimpleSelect value={f.type} onChange={(v) => setF({ ...f, type: v })} options={[{ value: "deposit", label: "জমা" }, { value: "withdraw", label: "উত্তোলন" }]} /></Field>
            <Field label="টাকার পরিমাণ"><Input type="number" min={1} required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="তারিখ"><Input type="date" value={f.txn_date} onChange={(e) => setF({ ...f, txn_date: e.target.value })} /></Field>
            <Field label="মন্তব্য" className="sm:col-span-2"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
            {f.member_id && <p className="text-sm text-muted-foreground sm:col-span-2">বর্তমান ব্যালেন্স: <b className="text-foreground">{taka(bal(f.member_id))}</b></p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={ins.isPending || !f.member_id}>সংরক্ষণ করুন</Button></div>
          </FormCard>
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Field label="শুরু"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="শেষ"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          <DataTable
            head={["তারিখ", "সদস্য নং", "নাম", "ধরন", "টাকা", "মন্তব্য", ""]}
            rows={filtered.map((t) => [bnDate(t.txn_date), mm.get(t.member_id)?.member_no, mm.get(t.member_id)?.name, label[t.type], taka(t.amount), t.note, <EditEntry key="e" table="savings_transactions" row={t} />])}
            foot={["মোট জমা", "", "", "", taka(sum(filtered.filter((t) => t.type !== "withdraw"), (t) => t.amount)), `উত্তোলন ${taka(sum(filtered.filter((t) => t.type === "withdraw"), (t) => t.amount))}`]}
          />
        </TabsContent>
        <TabsContent value="balance">
          <DataTable
            head={["সদস্য নং", "নাম", "মোট জমা", "উত্তোলন", "লভ্যাংশ", "ব্যালেন্স"]}
            rows={members.map((m) => {
              const t = tx.filter((x) => x.member_id === m.id);
              return [m.member_no, m.name, taka(sum(t.filter((x) => x.type === "deposit"), (x) => x.amount)), taka(sum(t.filter((x) => x.type === "withdraw"), (x) => x.amount)), taka(sum(t.filter((x) => x.type === "profit"), (x) => x.amount)), <b key="b">{taka(bal(m.id))}</b>];
            })}
          />
        </TabsContent>
        <TabsContent value="profit">
          <FormCard title="সকল সদস্যকে লভ্যাংশ প্রদান (ব্যালেন্সের উপর %)" onSubmit={distributeProfit}>
            <Field label="লভ্যাংশের হার (%)"><Input type="number" step="0.01" value={pr.rate} onChange={(e) => setPr({ ...pr, rate: e.target.value })} /></Field>
            <Field label="তারিখ"><Input type="date" value={pr.date} onChange={(e) => setPr({ ...pr, date: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Button type="submit">লভ্যাংশ বন্টন করুন</Button></div>
          </FormCard>
        </TabsContent>
        <TabsContent value="calc">
          <FormCard title="লাভ ক্যালকুলেটর" onSubmit={() => {}}>
            <Field label="টাকার পরিমাণ"><Input type="number" value={rate.amount} onChange={(e) => setRate({ ...rate, amount: e.target.value })} /></Field>
            <Field label="বার্ষিক হার (%)"><Input type="number" value={rate.rate} onChange={(e) => setRate({ ...rate, rate: e.target.value })} /></Field>
            <Field label="মেয়াদ (মাস)"><Input type="number" value={rate.months} onChange={(e) => setRate({ ...rate, months: e.target.value })} /></Field>
            <div className="rounded-lg bg-secondary p-4 text-sm">লাভ: <b>{taka(c)}</b><br />মোট: <b>{taka(Number(rate.amount) + c)}</b></div>
          </FormCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
