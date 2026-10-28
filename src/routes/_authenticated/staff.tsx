import { EditEntry } from "@/components/EditEntry";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, UserPlus, Users, Wallet, CalendarCheck, BadgeCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Field, FormCard, PageHeader, SimpleSelect, StatCard } from "@/components/kit";
import { useInsert, useRows, useUpdate } from "@/lib/db";
import { useAccess } from "@/lib/access";
import { useLang } from "@/lib/i18n";
import { bn, bnDate, sum, taka, todayISO } from "@/lib/format";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/staff")({ head: () => pageHead("কর্মী ও বেতন"), component: Staff });

function Staff() {
  const { t } = useLang();
  const access = useAccess();
  const canWrite = access.admin || access.write.has("staff");
  const { data: staff = [] } = useRows("staff"), { data: des = [] } = useRows("designations"), { data: att = [] } = useRows("attendance"), { data: pay = [] } = useRows("salary_payments"), { data: settings = [] } = useRows("somiti_settings", { order: "id" });
  const add = useInsert("staff"), designation = useInsert("designations"), salary = useInsert("salary_payments"), update = useUpdate("staff");
  const [f, setF] = useState({ name: "", phone: "", designation_id: "", salary: "", join_date: todayISO(), address: "" }), [d, setD] = useState("");
  const [p, setP] = useState({ staff_id: "", month: todayISO().slice(0, 7), amount: "", txn_date: todayISO(), note: "" });
  const [card, setCard] = useState(""), [month, setMonth] = useState(todayISO().slice(0, 7)), [attMonth, setAttMonth] = useState(todayISO().slice(0, 7));
  const person = staff.find((s) => s.id === card);
  const active = staff.filter((s) => s.status === "active");
  const options = active.map((s) => ({ value: s.id, label: s.name }));
  const monthPaid = sum(pay.filter((x) => x.month === month), (x) => x.amount);
  const monthDue = sum(active, (s) => s.salary);
  const todayPresent = att.filter((a) => a.attendance_date === todayISO() && (a.status === "present" || a.status === "late")).length;
  const desName = (id: string | null) => des.find((x) => x.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className={card ? "no-print space-y-6" : "space-y-6"}>
        <PageHeader title={t("কর্মী ও বেতন", "Staff & Salary")} subtitle={t("কর্মীর তথ্য, পদবি, বেতন ও হাজিরার রিপোর্ট", "Staff details, designations, salary and attendance report")}
          actions={<Button asChild className="gap-1.5"><Link to="/attendance"><UserCheck className="size-4" />{t("হাজিরা দিন", "Take attendance")}</Link></Button>} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("সক্রিয় কর্মী", "Active staff")} value={bn(active.length)} icon={<Users className="size-5" />} />
          <StatCard label={t("আজ উপস্থিত", "Present today")} value={`${bn(todayPresent)} / ${bn(active.length)}`} tone="success" icon={<CalendarCheck className="size-5" />} />
          <StatCard label={t("এ মাসের বেতন", "Salary this month")} value={taka(monthDue)} tone="gold" icon={<Wallet className="size-5" />} />
          <StatCard label={t("বেতন বাকি", "Salary due")} value={taka(Math.max(0, monthDue - monthPaid))} tone="destructive" icon={<BadgeCheck className="size-5" />} />
        </div>

        <Tabs defaultValue="list">
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted p-1">
            <TabsTrigger value="list" className="min-h-10">{t("কর্মী তালিকা", "Staff list")}</TabsTrigger>
            {canWrite && <TabsTrigger value="add" className="min-h-10">{t("নতুন কর্মী ও পদবি", "New staff & designations")}</TabsTrigger>}
            <TabsTrigger value="salary" className="min-h-10">{t("বেতন", "Salary")}</TabsTrigger>
            <TabsTrigger value="attendance" className="min-h-10">{t("হাজিরা রিপোর্ট", "Attendance report")}</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            {staff.length === 0 ? <p className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">{t("এখনো কোনো কর্মী নেই", "No staff yet")}</p> :
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {staff.map((s) => (
                  <article key={s.id} className="rounded-2xl border bg-card p-4 shadow-card">
                    <div className="flex items-start gap-3">
                      <span className="nav-teal flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold">{s.name.charAt(0)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{desName(s.designation_id)}</p>
                      </div>
                      <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + (s.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{s.status === "active" ? t("সক্রিয়", "Active") : t("বন্ধ", "Inactive")}</span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">{t("মোবাইল", "Mobile")}</dt><dd>{s.phone || "—"}</dd>
                      <dt className="text-muted-foreground">{t("বেতন", "Salary")}</dt><dd>{taka(s.salary)}</dd>
                      <dt className="text-muted-foreground">{t("যোগদান", "Joined")}</dt><dd>{bnDate(s.join_date)}</dd>
                      <dt className="text-muted-foreground">{t("লগইন", "Login")}</dt><dd>{s.user_id ? t("আছে", "Yes") : t("নেই", "No")}</dd>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                      {canWrite && <EditEntry table="staff" row={s} />}
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setCard(s.id)}><Printer className="size-4" />{t("আইডি কার্ড", "ID card")}</Button>
                      {canWrite && <Button variant="outline" size="sm" onClick={() => update.mutate({ id: s.id, values: { status: s.status === "active" ? "inactive" : "active" } })}>{s.status === "active" ? t("বন্ধ করুন", "Deactivate") : t("সক্রিয় করুন", "Activate")}</Button>}
                    </div>
                  </article>
                ))}
              </div>}
          </TabsContent>

          {canWrite && <TabsContent value="add" className="mt-4">
            <div className="grid gap-6 xl:grid-cols-2">
              <FormCard title={t("নতুন কর্মী", "New staff")} onSubmit={() => add.mutate({ ...f, salary: Number(f.salary), designation_id: f.designation_id || null }, { onSuccess: () => setF({ ...f, name: "", phone: "", address: "" }) })}>
                <Field label={t("নাম", "Name")}><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
                <Field label={t("মোবাইল", "Mobile")}><Input inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
                <Field label={t("পদবি", "Designation")}><SimpleSelect value={f.designation_id} onChange={(v) => setF({ ...f, designation_id: v })} options={des.map((x) => ({ value: x.id, label: x.name }))} /></Field>
                <Field label={t("মাসিক বেতন", "Monthly salary")}><Input type="number" min="0" required value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} /></Field>
                <Field label={t("যোগদানের তারিখ", "Join date")}><Input type="date" required value={f.join_date} onChange={(e) => setF({ ...f, join_date: e.target.value })} /></Field>
                <Field label={t("ঠিকানা", "Address")}><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
                <Button type="submit" disabled={add.isPending} className="gap-1.5"><UserPlus className="size-4" />{t("সংরক্ষণ করুন", "Save")}</Button>
              </FormCard>
              <FormCard title={t("পদবি", "Designations")} onSubmit={() => designation.mutate({ name: d }, { onSuccess: () => setD("") })}>
                <Field label={t("পদবির নাম", "Designation name")}><Input required value={d} onChange={(e) => setD(e.target.value)} /></Field>
                <Button type="submit" disabled={designation.isPending}>{t("যোগ করুন", "Add")}</Button>
                <div className="sm:col-span-2"><DataTable head={[t("পদবি", "Designation"), ""]} rows={des.map((x) => [x.name, <EditEntry key="e" table="designations" row={x} />])} /></div>
              </FormCard>
            </div>
          </TabsContent>}

          <TabsContent value="salary" className="mt-4 space-y-5">
            {canWrite && <FormCard title={t("বেতন প্রদান", "Pay salary")} onSubmit={() => salary.mutate({ ...p, amount: Number(p.amount) }, { onSuccess: () => setP({ ...p, amount: "", note: "" }) })}>
              <Field label={t("কর্মী", "Staff")}><SimpleSelect value={p.staff_id} onChange={(v) => setP({ ...p, staff_id: v, amount: String(staff.find((s) => s.id === v)?.salary ?? "") })} options={options} /></Field>
              <Field label={t("বেতনের মাস", "Month")}><Input type="month" required value={p.month} onChange={(e) => setP({ ...p, month: e.target.value })} /></Field>
              <Field label={t("টাকা", "Amount")}><Input type="number" min="0.01" step="0.01" required value={p.amount} onChange={(e) => setP({ ...p, amount: e.target.value })} /></Field>
              <Field label={t("প্রদানের তারিখ", "Paid on")}><Input type="date" required value={p.txn_date} onChange={(e) => setP({ ...p, txn_date: e.target.value })} /></Field>
              <Button type="submit" disabled={!p.staff_id || salary.isPending}>{t("বেতন সংরক্ষণ", "Save salary")}</Button>
            </FormCard>}
            <div className="no-print flex flex-wrap items-end gap-3"><Field label={t("বেতনের মাস", "Month")}><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field><Button variant="outline" onClick={() => window.print()} className="gap-1.5"><Printer className="size-4" />{t("বেতন রিপোর্ট প্রিন্ট", "Print salary report")}</Button></div>
            <DataTable head={[t("কর্মী", "Staff"), t("নির্ধারিত বেতন", "Salary"), t("প্রদান", "Paid"), t("বাকি", "Due")]} rows={staff.map((s) => { const paid = sum(pay.filter((x) => x.staff_id === s.id && x.month === month), (x) => x.amount); return [s.name, taka(s.salary), taka(paid), taka(Math.max(0, s.salary - paid))]; })} />
            <h2 className="text-lg font-semibold">{t("সংরক্ষিত বেতন প্রদান", "Saved salary payments")}</h2>
            <DataTable head={[t("কর্মী", "Staff"), t("মাস", "Month"), t("টাকা", "Amount"), t("তারিখ", "Date"), ""]} rows={pay.filter((x) => x.month === month).map((x) => [staff.find((s) => s.id === x.staff_id)?.name, x.month, taka(x.amount), bnDate(x.txn_date), canWrite ? <EditEntry key="e" table="salary_payments" row={x} /> : null])} />
          </TabsContent>

          <TabsContent value="attendance" className="mt-4 space-y-4">
            <Field label={t("মাস", "Month")}><Input className="max-w-xs" type="month" value={attMonth} onChange={(e) => setAttMonth(e.target.value)} /></Field>
            <DataTable head={[t("কর্মী", "Staff"), t("উপস্থিত", "Present"), t("বিলম্ব", "Late"), t("অনুপস্থিত", "Absent"), t("ছুটি", "Leave")]}
              rows={staff.map((s) => { const m = att.filter((a) => a.staff_id === s.id && a.attendance_date.startsWith(attMonth)); const c = (x: string) => bn(m.filter((a) => a.status === x).length); return [s.name, c("present"), c("late"), c("absent"), c("leave")]; })} />
          </TabsContent>
        </Tabs>
      </div>
      {person && <section className="mx-auto max-w-sm rounded-2xl border border-border p-6"><div className="no-print mb-4 flex gap-2"><Button onClick={() => window.print()}>{t("প্রিন্ট", "Print")}</Button><Button variant="outline" onClick={() => setCard("")}>{t("বন্ধ", "Close")}</Button></div><h2 className="text-center font-display text-xl">{settings[0]?.name}</h2><h3 className="my-5 text-center text-lg">{t("কর্মী পরিচয়পত্র", "Staff ID Card")}</h3><p className="text-xl font-semibold">{person.name}</p><p>{desName(person.designation_id)}</p><p>{t("মোবাইল", "Mobile")}: {person.phone}</p><p>{t("যোগদান", "Joined")}: {bnDate(person.join_date)}</p><p>ID: {person.id.slice(0, 8).toUpperCase()}</p><p className="mt-10 text-right">{t("অনুমোদনকারীর স্বাক্ষর", "Authorized signature")}</p></section>}
    </div>
  );
}
