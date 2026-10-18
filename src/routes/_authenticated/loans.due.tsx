import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, PageHeader, useMemberMap } from "@/components/kit";
import { useRows } from "@/lib/db";
import { bn, sum, taka, todayISO } from "@/lib/format";
import { isDueOn, loanStatus, type InstallmentType } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/loans/due")({
  head: () => ({ meta: [{ title: "আজকের কিস্তি ও বকেয়া — সোনালী সমিতি" }] }),
  component: Due,
});

function Due() {
  const { data: loans = [] } = useRows("loans");
  const { data: rep = [] } = useRows("loan_repayments");
  const mm = useMemberMap();
  const today = todayISO();
  const active = loans.filter((l) => l.status === "active");
  const paid = (id: string) => sum(rep.filter((r) => r.loan_id === id), (r) => r.amount);
  const dueToday = active.filter((l) => isDueOn(l.first_due_date, l.installment_type as InstallmentType, l.installment_count, today));
  const overdue = active.map((l) => ({ l, s: loanStatus(l, paid(l.id), today) })).filter((x) => x.s.overdueAmount > 0);

  return (
    <div>
      <PageHeader title="আজকের কিস্তি ও বকেয়া" />
      <Tabs defaultValue="today">
        <TabsList className="mb-4">
          <TabsTrigger value="today">আজ লোনের কিস্তির তারিখ ({bn(dueToday.length)})</TabsTrigger>
          <TabsTrigger value="over">মেয়াদ উত্তীর্ণ ({bn(overdue.length)})</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <DataTable
            head={["লোন নং", "সদস্য", "মোবাইল", "কিস্তি", "আজ আদায়"]}
            rows={dueToday.map((l) => [l.loan_no, mm.get(l.member_id)?.name, mm.get(l.member_id)?.phone, taka(l.installment_amount), rep.some((r) => r.loan_id === l.id && r.txn_date === today) ? "হ্যাঁ" : <span key="n" className="text-destructive">না</span>])}
          />
        </TabsContent>
        <TabsContent value="over">
          <DataTable
            head={["লোন নং", "সদস্য", "মোবাইল", "বকেয়া কিস্তি", "বকেয়া টাকা", "অবশিষ্ট"]}
            rows={overdue.map(({ l, s }) => [l.loan_no, mm.get(l.member_id)?.name, mm.get(l.member_id)?.phone, bn(s.overdueInstallments), <span key="o" className="text-destructive">{taka(s.overdueAmount)}</span>, taka(s.remaining)])}
            foot={["মোট", "", "", "", taka(sum(overdue, (x) => x.s.overdueAmount)), taka(sum(overdue, (x) => x.s.remaining))]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
