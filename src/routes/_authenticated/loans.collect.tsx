import { pageHead } from "@/lib/metadata";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Field, FormCard, PageHeader, SimpleSelect, useMemberMap } from "@/components/kit";
import { useInsert, useRows, useUpdate } from "@/lib/db";
import { bnDate, sum, taka, todayISO } from "@/lib/format";
import { loanStatus } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/loans/collect")({
  head: () => pageHead("লোন কিস্তি কালেকশন"),
  component: Collect,
});

function Collect() {
  const { data: loans = [] } = useRows("loans");
  const { data: rep = [] } = useRows("loan_repayments");
  const mm = useMemberMap();
  const ins = useInsert("loan_repayments", "কিস্তি আদায় হয়েছে");
  const upd = useUpdate("loans");
  const today = todayISO();
  const [f, setF] = useState({ loan_id: "", amount: "", late_fee: "0", txn_date: today, note: "" });
  const [day, setDay] = useState(today);

  const active = loans.filter((l) => l.status === "active");
  const loan = loans.find((l) => l.id === f.loan_id);
  const paid = loan ? sum(rep.filter((r) => r.loan_id === loan.id), (r) => r.amount) : 0;
  const st = loan ? loanStatus(loan, paid, today) : null;

  function save() {
    if (!loan) return;
    const amount = Number(f.amount);
    ins.mutate(
      { loan_id: loan.id, member_id: loan.member_id, amount, late_fee: Number(f.late_fee) || 0, txn_date: f.txn_date, note: f.note },
      {
        onSuccess: () => {
          if (paid + amount >= loan.total_payable) upd.mutate({ id: loan.id, values: { status: "closed" } });
          setF({ ...f, loan_id: "", amount: "", late_fee: "0", note: "" });
        },
      },
    );
  }

  const list = rep.filter((r) => r.txn_date === day);
  const loanNo = new Map(loans.map((l) => [l.id, l.loan_no]));

  return (
    <div className="space-y-6">
      <PageHeader title="লোন কিস্তি কালেকশন" />
      <FormCard title="কিস্তি আদায়" onSubmit={save}>
        <Field label="লোন / সদস্য">
          <SimpleSelect
            value={f.loan_id}
            onChange={(v) => {
              const l = loans.find((x) => x.id === v);
              setF({ ...f, loan_id: v, amount: l ? String(l.installment_amount) : "" });
            }}
            options={active.map((l) => ({ value: l.id, label: `${l.loan_no} — ${mm.get(l.member_id)?.name ?? ""} (${mm.get(l.member_id)?.member_no ?? ""})` }))}
          />
        </Field>
        <Field label="কিস্তির টাকা"><Input type="number" min={1} required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="বিলম্ব চার্জ"><Input type="number" min={0} value={f.late_fee} onChange={(e) => setF({ ...f, late_fee: e.target.value })} /></Field>
        <Field label="তারিখ"><Input type="date" value={f.txn_date} onChange={(e) => setF({ ...f, txn_date: e.target.value })} /></Field>
        {loan && st && (
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary p-4 text-sm sm:col-span-2 sm:grid-cols-4">
            <div>মোট পরিশোধযোগ্য<br /><b>{taka(loan.total_payable)}</b></div>
            <div>আদায় হয়েছে<br /><b>{taka(paid)}</b></div>
            <div>অবশিষ্ট<br /><b>{taka(st.remaining)}</b></div>
            <div>বকেয়া<br /><b className="text-destructive">{taka(st.overdueAmount)}</b></div>
          </div>
        )}
        <div className="sm:col-span-2"><Button type="submit" disabled={!loan || ins.isPending}>কিস্তি জমা করুন</Button></div>
      </FormCard>
      <div className="flex items-end gap-3">
        <Field label="তারিখ অনুযায়ী কালেকশন"><Input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></Field>
      </div>
      <DataTable
        head={["তারিখ", "লোন নং", "সদস্য", "কিস্তি", "বিলম্ব চার্জ", "মন্তব্য"]}
        rows={list.map((r) => [bnDate(r.txn_date), loanNo.get(r.loan_id), mm.get(r.member_id)?.name, taka(r.amount), taka(r.late_fee), r.note])}
        foot={["মোট", "", "", taka(sum(list, (r) => r.amount)), taka(sum(list, (r) => r.late_fee)), ""]}
      />
    </div>
  );
}
