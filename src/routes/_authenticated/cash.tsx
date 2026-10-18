import { pageHead } from "@/lib/metadata";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Field, FormCard, PageHeader, SimpleSelect } from "@/components/kit";
import { useDelete, useInsert, useRows } from "@/lib/db";
import { bnDate, sum, taka, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cash")({
  head: () => pageHead("জমা খরচ ব্যবস্থাপনা"),
  component: Cash,
});

const kindLabel: Record<string, string> = { expense: "খরচ", income: "অন্যান্য আয় / নগদ জমা", opening: "প্রারম্ভিক ক্যাশ" };

function Cash() {
  const today = todayISO();
  const { data: heads = [] } = useRows("account_heads");
  const { data: entries = [] } = useRows("cash_entries");
  const insHead = useInsert("account_heads");
  const ins = useInsert("cash_entries");
  const del = useDelete("cash_entries");
  const hMap = new Map(heads.map((h) => [h.id, h.name]));
  const [h, setH] = useState({ name: "", kind: "expense" });
  const [e, setE] = useState({ kind: "expense", head_id: "", amount: "", txn_date: today, note: "" });
  const [from, setFrom] = useState(today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const list = entries.filter((x) => x.txn_date >= from && x.txn_date <= to);

  return (
    <div>
      <PageHeader title="জমা খরচ ব্যবস্থাপনা" />
      <Tabs defaultValue="entry">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="entry">খরচ / আয় এন্ট্রি</TabsTrigger>
          <TabsTrigger value="report">খরচের রিপোর্ট</TabsTrigger>
          <TabsTrigger value="heads">খাত ব্যবস্থাপনা</TabsTrigger>
        </TabsList>
        <TabsContent value="entry">
          <FormCard title="টাকা প্রদান / খরচ / নগদ জমা এন্ট্রি" onSubmit={() => ins.mutate({ ...e, head_id: e.head_id || null, amount: Number(e.amount) }, { onSuccess: () => setE({ ...e, amount: "", note: "" }) })}>
            <Field label="ধরন"><SimpleSelect value={e.kind} onChange={(v) => setE({ ...e, kind: v, head_id: "" })} options={Object.entries(kindLabel).map(([value, label]) => ({ value, label }))} /></Field>
            {e.kind !== "opening" && <Field label="খাত"><SimpleSelect value={e.head_id} onChange={(v) => setE({ ...e, head_id: v })} options={heads.filter((x) => x.kind === e.kind).map((x) => ({ value: x.id, label: x.name }))} /></Field>}
            <Field label="টাকা"><Input type="number" min={1} required value={e.amount} onChange={(ev) => setE({ ...e, amount: ev.target.value })} /></Field>
            <Field label="তারিখ"><Input type="date" value={e.txn_date} onChange={(ev) => setE({ ...e, txn_date: ev.target.value })} /></Field>
            <Field label="বিবরণ" className="sm:col-span-2"><Input value={e.note} onChange={(ev) => setE({ ...e, note: ev.target.value })} /></Field>
            <div className="sm:col-span-2"><Button type="submit">সংরক্ষণ করুন</Button></div>
          </FormCard>
        </TabsContent>
        <TabsContent value="report" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Field label="শুরু"><Input type="date" value={from} onChange={(ev) => setFrom(ev.target.value)} /></Field>
            <Field label="শেষ"><Input type="date" value={to} onChange={(ev) => setTo(ev.target.value)} /></Field>
          </div>
          <DataTable
            head={["তারিখ", "ধরন", "খাত", "বিবরণ", "টাকা", ""]}
            rows={list.map((x) => [bnDate(x.txn_date), kindLabel[x.kind], hMap.get(x.head_id ?? "") ?? "—", x.note, taka(x.amount), <Button key="d" size="icon" variant="ghost" onClick={() => confirm("মুছবেন?") && del.mutate(x.id)}><Trash2 className="size-4 text-destructive" /></Button>])}
            foot={["মোট খরচ", "", "", "", taka(sum(list.filter((x) => x.kind === "expense"), (x) => x.amount)), ""]}
          />
        </TabsContent>
        <TabsContent value="heads" className="space-y-4">
          <FormCard title="নতুন খাত" onSubmit={() => insHead.mutate(h, { onSuccess: () => setH({ ...h, name: "" }) })}>
            <Field label="খাতের নাম"><Input required value={h.name} onChange={(ev) => setH({ ...h, name: ev.target.value })} /></Field>
            <Field label="ধরন"><SimpleSelect value={h.kind} onChange={(v) => setH({ ...h, kind: v })} options={[{ value: "expense", label: "খরচের খাত" }, { value: "income", label: "আয় / নগদ জমার খাত" }]} /></Field>
            <div className="sm:col-span-2"><Button type="submit">খাত যোগ করুন</Button></div>
          </FormCard>
          <DataTable head={["খাতের নাম", "ধরন", "মোট"]} rows={heads.map((x) => [x.name, x.kind === "expense" ? "খরচ" : "আয়", taka(sum(entries.filter((en) => en.head_id === x.id), (en) => en.amount))])} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
