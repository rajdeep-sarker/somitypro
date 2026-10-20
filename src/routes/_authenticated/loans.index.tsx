import { useCenterRows } from "@/components/CenterScope";
import { EditEntry } from "@/components/EditEntry";
import { pageHead } from "@/lib/metadata";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, DateFilter, Field, FormCard, inRange, MemberSelect, PageHeader, SimpleSelect, useDateRange, useMemberMap } from "@/components/kit";
import { nextNo, useInsert, useRows, useUpdate } from "@/lib/db";
import { bn, bnDate, sum, taka, todayISO } from "@/lib/format";
import { addPeriods, calcLoan, installmentLabels, loanStatus, type InstallmentType } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/loans/")({
  head: () => pageHead("লোন ব্যবস্থাপনা"),
  component: Loans,
});

const typeOpts = (Object.keys(installmentLabels) as InstallmentType[]).map((k) => ({ value: k, label: installmentLabels[k] }));

function Loans() {
  const { data: loans = [] } = useCenterRows("loans");
  const { data: rep = [] } = useCenterRows("loan_repayments");
  const mm = useMemberMap();
  const ins = useInsert("loans", "লোন প্রদান সম্পন্ন হয়েছে");
  const upd = useUpdate("loans");
  const feeIns = useInsert("member_fees", "সার্ভিস চার্জ জমা হয়েছে");
  const today = todayISO();
  const [f, setF] = useState({ member_id: "", principal: "", interest_rate: "10", service_charge: "0", installment_type: "weekly", installment_count: "45", disburse_date: today, purpose: "", guarantor: "" });
  const c = calcLoan(Number(f.principal) || 0, Number(f.interest_rate) || 0, Number(f.installment_count) || 1);
  const [sched, setSched] = useState<string | null>(null);
  const [range, setRange] = useDateRange();
  const filteredLoans = loans.filter((l) => inRange(l.disburse_date, range));

  const paid = (id: string) => sum(rep.filter((r) => r.loan_id === id), (r) => r.amount);

  function save() {
    if (!f.member_id || !c.total) return;
    const type = f.installment_type as InstallmentType;
    const loan_no = nextNo("L-", loans.map((l) => l.loan_no));
    ins.mutate(
      {
        loan_no, member_id: f.member_id, principal: Number(f.principal), interest_rate: Number(f.interest_rate), service_charge: Number(f.service_charge),
        total_payable: c.total, installment_type: type, installment_count: Number(f.installment_count), installment_amount: c.installment,
        disburse_date: f.disburse_date, first_due_date: addPeriods(f.disburse_date, type, 1), purpose: f.purpose, guarantor: f.guarantor,
      },
      {
        onSuccess: () => {
          if (Number(f.service_charge) > 0) feeIns.mutate({ member_id: f.member_id, fee_type: "service", amount: Number(f.service_charge), txn_date: f.disburse_date, note: `লোন ${loan_no} সার্ভিস চার্জ` });
          setF({ ...f, member_id: "", principal: "", purpose: "", guarantor: "" });
        },
      },
    );
  }

  const schedLoan = loans.find((l) => l.id === sched);

  return (
    <div>
      <PageHeader title="লোন ব্যবস্থাপনা" subtitle={`সক্রিয় লোন ${bn(loans.filter((l) => l.status === "active").length)} টি`} />
      <Tabs defaultValue="list">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="list">সকল লোনের তথ্য</TabsTrigger>
          <TabsTrigger value="new">লোন প্রদান</TabsTrigger>
        </TabsList>
        <TabsContent value="new">
          <FormCard title="নতুন লোন প্রদান" onSubmit={save}>
            <Field label="সদস্য"><MemberSelect value={f.member_id} onChange={(v) => setF({ ...f, member_id: v })} /></Field>
            <Field label="লোনের পরিমাণ"><Input type="number" min={1} required value={f.principal} onChange={(e) => setF({ ...f, principal: e.target.value })} /></Field>
            <Field label="সুদ / লাভের হার (%)"><Input type="number" step="0.01" value={f.interest_rate} onChange={(e) => setF({ ...f, interest_rate: e.target.value })} /></Field>
            <Field label="সার্ভিস চার্জ (টাকা)"><Input type="number" value={f.service_charge} onChange={(e) => setF({ ...f, service_charge: e.target.value })} /></Field>
            <Field label="কিস্তির ধরন"><SimpleSelect value={f.installment_type} onChange={(v) => setF({ ...f, installment_type: v })} options={typeOpts} /></Field>
            <Field label="কিস্তির সংখ্যা"><Input type="number" min={1} value={f.installment_count} onChange={(e) => setF({ ...f, installment_count: e.target.value })} /></Field>
            <Field label="প্রদানের তারিখ"><Input type="date" value={f.disburse_date} onChange={(e) => setF({ ...f, disburse_date: e.target.value })} /></Field>
            <Field label="জামিনদার"><Input value={f.guarantor} onChange={(e) => setF({ ...f, guarantor: e.target.value })} /></Field>
            <Field label="লোনের উদ্দেশ্য" className="sm:col-span-2"><Input value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary p-4 text-sm sm:col-span-2">
              <div>লাভ<br /><b>{taka(c.interest)}</b></div>
              <div>মোট পরিশোধ<br /><b>{taka(c.total)}</b></div>
              <div>প্রতি কিস্তি<br /><b>{taka(c.installment)}</b></div>
            </div>
            <div className="sm:col-span-2"><Button type="submit" disabled={ins.isPending || !f.member_id}>লোন প্রদান করুন</Button></div>
          </FormCard>
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <DateFilter range={range} onChange={setRange} />
          <DataTable
            head={["লোন নং", "সদস্য", "লোন", "মোট পরিশোধযোগ্য", "আদায়", "অবশিষ্ট", "কিস্তি", "বকেয়া", "অবস্থা", ""]}
            rows={filteredLoans.map((l) => {
              const p = paid(l.id);
              const s = loanStatus(l, p, today);
              return [
                l.loan_no, `${mm.get(l.member_id)?.name ?? ""} (${mm.get(l.member_id)?.member_no ?? ""})`, taka(l.principal), taka(l.total_payable), taka(p), taka(s.remaining),
                `${taka(l.installment_amount)} × ${bn(l.installment_count)} (${installmentLabels[l.installment_type as InstallmentType]})`,
                s.overdueAmount > 0 && l.status === "active" ? <span key="o" className="text-destructive">{taka(s.overdueAmount)}</span> : "—",
                <Badge key="s" variant={l.status === "active" ? "default" : "secondary"}>{l.status === "active" ? "চলমান" : "বন্ধ"}</Badge>,
                <div key="a" className="flex gap-1"><EditEntry table="loans" row={l} />
                  <Button size="sm" variant="outline" onClick={() => setSched(l.id)}>কিস্তির তারিখ</Button>
                  {l.status === "active" && <Button size="sm" variant="ghost" onClick={() => confirm("লোন বন্ধ করবেন?") && upd.mutate({ id: l.id, values: { status: "closed" } })}>বন্ধ করুন</Button>}
                </div>,
              ];
            })}
          />
          {schedLoan && (
            <div>
              <h3 className="mb-2 font-semibold">কিস্তির তারিখ — {schedLoan.loan_no}</h3>
              <DataTable
                head={["কিস্তি নং", "তারিখ", "টাকা", "অবস্থা"]}
                rows={Array.from({ length: schedLoan.installment_count }, (_, i) => {
                  const date = addPeriods(schedLoan.first_due_date, schedLoan.installment_type as InstallmentType, i);
                  const covered = paid(schedLoan.id) >= (i + 1) * schedLoan.installment_amount - 0.01;
                  return [bn(i + 1), bnDate(date), taka(schedLoan.installment_amount), covered ? "পরিশোধিত" : date < today ? <span key="x" className="text-destructive">বকেয়া</span> : "বাকি"];
                })}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
