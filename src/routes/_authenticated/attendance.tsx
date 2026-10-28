import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCheck, UserCheck, UserX, Clock, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/kit";
import { useRows } from "@/lib/db";
import { upsertRow } from "@/lib/data.functions";
import { useAccess } from "@/lib/access";
import { useLang } from "@/lib/i18n";
import { bn, bnDate, todayISO } from "@/lib/format";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/attendance")({ head: () => pageHead("হাজিরা দিন"), component: Attendance });

const STATUSES = [
  { id: "present", bn: "উপস্থিত", en: "Present", icon: UserCheck, on: "bg-success text-success-foreground border-success" },
  { id: "absent", bn: "অনুপস্থিত", en: "Absent", icon: UserX, on: "bg-destructive text-destructive-foreground border-destructive" },
  { id: "late", bn: "বিলম্ব", en: "Late", icon: Clock, on: "bg-gold text-foreground border-gold" },
  { id: "leave", bn: "ছুটি", en: "Leave", icon: Plane, on: "bg-chart-2 text-primary-foreground border-chart-2" },
] as const;

function Attendance() {
  const { t, lang } = useLang();
  const access = useAccess();
  const canWrite = access.admin || access.write.has("staff");
  const qc = useQueryClient();
  const { data: staff = [] } = useRows("staff");
  const { data: att = [] } = useRows("attendance");
  const { data: des = [] } = useRows("designations");
  const [date, setDate] = useState(todayISO());
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const active = useMemo(() => staff.filter((s) => s.status === "active"), [staff]);
  const saved = useMemo(() => new Map(att.filter((a) => a.attendance_date === date).map((a) => [a.staff_id, a.status])), [att, date]);
  useEffect(() => { setMarks(Object.fromEntries(saved)); }, [saved]);

  const n = (x: number) => (lang === "en" ? String(x) : bn(x));
  const count = (id: string) => active.filter((s) => marks[s.id] === id).length;
  const unmarked = active.filter((s) => !marks[s.id]).length;
  const changed = active.filter((s) => marks[s.id] && marks[s.id] !== saved.get(s.id));

  async function save() {
    setBusy(true);
    try {
      for (const s of changed) {
        await upsertRow({ data: { table: "attendance", keys: ["staff_id", "attendance_date"], values: { staff_id: s.id, attendance_date: date, status: marks[s.id] } } });
      }
      await qc.invalidateQueries({ queryKey: ["t", "attendance"] });
      toast.success(t(`${bn(changed.length)} জনের হাজিরা সংরক্ষিত`, `Attendance saved for ${changed.length}`));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("হাজিরা সংরক্ষণ হয়নি", "Could not save attendance"));
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("কর্মীদের হাজিরা", "Staff Attendance")} subtitle={t("কে এসেছে আর কে আসেনি — তারিখ বেছে চিহ্নিত করুন", "Mark who came and who didn't for the chosen date")} />
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4 shadow-card">
        <label className="space-y-1"><span className="block text-sm font-medium">{t("তারিখ", "Date")}</span>
          <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="w-48" /></label>
        <p className="pb-2 text-sm text-muted-foreground">{bnDate(date)}</p>
        {canWrite && <Button variant="outline" className="ml-auto gap-1.5" onClick={() => setMarks(Object.fromEntries(active.map((s) => [s.id, "present"])))}>
          <CheckCheck className="size-4" />{t("সবাই উপস্থিত", "Mark all present")}</Button>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUSES.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-3 shadow-card">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><s.icon className="size-4" />{t(s.bn, s.en)}</p>
            <p className="text-2xl font-semibold">{n(count(s.id))}</p>
          </div>
        ))}
        <div className="rounded-xl border bg-card p-3 shadow-card"><p className="text-sm text-muted-foreground">{t("বাকি", "Not marked")}</p><p className="text-2xl font-semibold">{n(unmarked)}</p></div>
      </div>

      {active.length === 0 ? (
        <p className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">{t("কোনো সক্রিয় কর্মী নেই — আগে কর্মী যোগ করুন", "No active staff — add staff first")}</p>
      ) : (
        <ul className="space-y-2">
          {active.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-card">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold">{n(i + 1)}</span>
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">{des.find((d) => d.id === s.designation_id)?.name ?? "—"}{s.phone ? ` · ${s.phone}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((st) => {
                  const on = marks[s.id] === st.id;
                  return (
                    <button key={st.id} type="button" disabled={!canWrite} aria-pressed={on} onClick={() => setMarks({ ...marks, [s.id]: st.id })}
                      className={"flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-60 " + (on ? st.on : "border-border bg-card hover:bg-muted")}>
                      <st.icon className="size-4" />{t(st.bn, st.en)}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canWrite && active.length > 0 && (
        <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-card">
          <p className="text-sm text-muted-foreground">{changed.length ? t(`${bn(changed.length)} জনের পরিবর্তন সংরক্ষণ বাকি`, `${changed.length} unsaved change(s)`) : t("সব সংরক্ষিত", "All saved")}</p>
          <Button size="lg" disabled={busy || changed.length === 0} onClick={save}>{t("হাজিরা জমা দিন", "Submit attendance")}</Button>
        </div>
      )}
    </div>
  );
}
