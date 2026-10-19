import { pageHead } from "@/lib/metadata";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, DateFilter, Field, FormCard, inRange, MemberSelect, PageHeader, SimpleSelect, useDateRange, useMemberMap } from "@/components/kit";
import { useInsert, useRows } from "@/lib/db";
import { bnDate, sum, taka, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/fees")({
  head: () => pageHead("সমিতি ফি কালেকশন"),
  component: Fees,
});

const feeLabel: Record<string, string> = { admission: "ভর্তি ফি", monthly: "মাসিক সমিতি ফি", late: "বিলম্ব চার্জ", service: "সার্ভিস চার্জ", other: "অন্যান্য" };

function Fees() {
  const { data: fees = [] } = useRows("member_fees");
  const mm = useMemberMap();
  const ins = useInsert("member_fees");
  const today = todayISO();
  const [f, setF] = useState({ member_id: "", fee_type: "monthly", amount: "", txn_date: today, note: "" });
  const [type, setType] = useState("all");
  const [range, setRange] = useDateRange();
  const list = fees.filter((x) => (type === "all" || x.fee_type === type) && inRange(x.txn_date, range));

  return (
    <div className="space-y-6">
      <PageHeader title="সমিতি ফি কালেকশন" subtitle="ভর্তি ফি, মাসিক ফি, বিলম্ব চার্জ ও সার্ভিস চার্জ" />
      <FormCard title="ফি আদায়" onSubmit={() => ins.mutate({ ...f, amount: Number(f.amount) }, { onSuccess: () => setF({ ...f, member_id: "", amount: "", note: "" }) })}>
        <Field label="সদস্য"><MemberSelect value={f.member_id} onChange={(v) => setF({ ...f, member_id: v })} /></Field>
        <Field label="ফি এর ধরন"><SimpleSelect value={f.fee_type} onChange={(v) => setF({ ...f, fee_type: v })} options={Object.entries(feeLabel).map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="টাকা"><Input type="number" min={1} required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="তারিখ"><Input type="date" value={f.txn_date} onChange={(e) => setF({ ...f, txn_date: e.target.value })} /></Field>
        <Field label="মন্তব্য" className="sm:col-span-2"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Button type="submit" disabled={!f.member_id || ins.isPending}>সংরক্ষণ করুন</Button></div>
      </FormCard>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48"><SimpleSelect value={type} onChange={setType} options={[{ value: "all", label: "সকল ফি" }, ...Object.entries(feeLabel).map(([value, label]) => ({ value, label }))]} /></div>
        <DateFilter range={range} onChange={setRange} />
      </div>
      <DataTable
        head={["তারিখ", "সদস্য নং", "নাম", "ধরন", "টাকা", "মন্তব্য"]}
        rows={list.map((x) => [bnDate(x.txn_date), mm.get(x.member_id)?.member_no, mm.get(x.member_id)?.name, feeLabel[x.fee_type], taka(x.amount), x.note])}
        foot={["মোট", "", "", "", taka(sum(list, (x) => x.amount)), ""]}
      />
    </div>
  );
}
