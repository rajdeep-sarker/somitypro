import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, MessageSquarePlus, Forward, XCircle, CheckCircle2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/kit";
import { actOnRequest, listChangeRequests, submitChangeRequest, type ChangeRequest } from "@/lib/requests.functions";
import { useAccess } from "@/lib/access";
import { useLang } from "@/lib/i18n";
import { bnDate } from "@/lib/format";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/requests")({ head: () => pageHead("পরিবর্তনের অনুরোধ"), component: Requests });

const STATUS: Record<string, { bn: string; en: string; cls: string }> = {
  new: { bn: "অ্যাডমিনের কাছে", en: "With admin", cls: "bg-gold/20 text-foreground" },
  forwarded: { bn: "CTO-র কাছে পাঠানো", en: "Sent to CTO", cls: "bg-primary/15 text-primary" },
  implemented: { bn: "যোগ করা হয়েছে", en: "Implemented", cls: "bg-success/15 text-success" },
  declined: { bn: "করা হয়নি", en: "Declined", cls: "bg-destructive/15 text-destructive" },
  closed: { bn: "বন্ধ", en: "Closed", cls: "bg-muted text-muted-foreground" },
};

function Requests() {
  const { t } = useLang();
  const access = useAccess();
  const qc = useQueryClient();
  const submit = useServerFn(submitChangeRequest);
  const list = useServerFn(listChangeRequests);
  const act = useServerFn(actOnRequest);
  const { data: rows = [] } = useQuery({ queryKey: ["change-requests", "list"], queryFn: () => list(), enabled: access.ready });
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const role = access.cto ? "cto" : access.admin ? "admin" : "staff";

  async function refresh() { await qc.invalidateQueries({ queryKey: ["change-requests"] }); }
  async function send(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await submit({ data: { title, details } }); setTitle(""); setDetails("");
      toast.success(role === "admin" ? t("অনুরোধ CTO-র কাছে পাঠানো হয়েছে", "Request sent to the CTO") : t("অনুরোধ অ্যাডমিনের কাছে পাঠানো হয়েছে", "Request sent to the admin"));
      await refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : t("পাঠানো যায়নি", "Could not send")); }
    finally { setBusy(false); }
  }
  async function doAct(r: ChangeRequest, action: "forward" | "close" | "implemented" | "declined") {
    setBusy(true);
    try { await act({ data: { id: r.id, action, note: notes[r.id] ?? "" } }); setNotes({ ...notes, [r.id]: "" }); toast.success(t("হালনাগাদ হয়েছে", "Updated")); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : t("হয়নি", "Failed")); }
    finally { setBusy(false); }
  }

  const waiting = rows.filter((r) => (role === "admin" ? r.status === "new" : role === "cto" ? r.status === "forwarded" : false));
  const rest = rows.filter((r) => !waiting.includes(r));

  const card = (r: ChangeRequest, actionable: boolean) => (
    <article key={r.id} className="space-y-2 rounded-xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <MessageSquarePlus className="size-4 text-primary" /><p className="flex-1 font-semibold">{r.title}</p>
        <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + (STATUS[r.status]?.cls ?? "")}>{t(STATUS[r.status]?.bn ?? r.status, STATUS[r.status]?.en ?? r.status)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{r.details}</p>
      <p className="text-xs text-muted-foreground">{r.user_name || "—"} ({r.from_role === "admin" ? "Admin" : "Staff"}) · {bnDate(r.created_at.slice(0, 10))}</p>
      {r.admin_note && <p className="rounded-lg bg-muted p-2 text-sm"><b>{t("অ্যাডমিনের মন্তব্য:", "Admin note:")}</b> {r.admin_note}</p>}
      {r.reply && <p className="rounded-lg bg-secondary p-2 text-sm"><b>{t("CTO-র উত্তর:", "CTO reply:")}</b> {r.reply}</p>}
      {actionable && (
        <div className="space-y-2 border-t pt-3">
          <Textarea rows={2} value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
            placeholder={role === "cto" ? t("উত্তর লিখুন — না করলে কেন করা হয়নি", "Reply — if declined, explain why") : t("মন্তব্য (ঐচ্ছিক)", "Note (optional)")} />
          <div className="flex flex-wrap gap-2">
            {role === "admin" ? <>
              <Button size="sm" disabled={busy} className="gap-1" onClick={() => void doAct(r, "forward")}><Forward className="size-4" />{t("CTO-কে পাঠান", "Forward to CTO")}</Button>
              <Button size="sm" variant="outline" disabled={busy} className="gap-1" onClick={() => void doAct(r, "close")}><XCircle className="size-4" />{t("বন্ধ করুন", "Close")}</Button>
            </> : <>
              <Button size="sm" disabled={busy} className="gap-1" onClick={() => void doAct(r, "implemented")}><CheckCircle2 className="size-4" />{t("যোগ করা হয়েছে", "Implemented")}</Button>
              <Button size="sm" variant="outline" disabled={busy} className="gap-1 text-destructive" onClick={() => void doAct(r, "declined")}><Ban className="size-4" />{t("করা হবে না", "Decline")}</Button>
            </>}
          </div>
        </div>
      )}
    </article>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={role === "cto" ? t("ফিচার অনুরোধ — CTO প্যানেল", "Feature requests — CTO panel") : t("পরিবর্তনের অনুরোধ (Changes needed)", "Changes needed")}
        subtitle={role === "cto" ? t("অ্যাডমিন যেসব অনুরোধ পাঠিয়েছেন — যোগ করুন বা কেন করা হবে না জানিয়ে দিন", "Requests forwarded by the admin — implement or explain why not")
          : role === "admin" ? t("কর্মীদের অনুরোধ দেখুন ও CTO-কে পাঠান, অথবা নিজের অনুরোধ সরাসরি CTO-কে লিখুন", "Review staff requests and forward them, or write your own straight to the CTO")
          : t("কী পরিবর্তন দরকার লিখুন — অ্যাডমিন দেখবেন", "Write what should change — the admin will review it")} />
      {role !== "cto" && (
        <form onSubmit={send} className="max-w-3xl space-y-4 rounded-2xl border bg-card p-5 shadow-card">
          <label className="block space-y-1"><span className="text-sm font-medium">{t("বিষয়", "Subject")}</span>
            <Input required minLength={2} maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("যেমন: লোন রিপোর্টে নতুন কলাম", "e.g. New column in loan report")} /></label>
          <label className="block space-y-1"><span className="text-sm font-medium">{t("বিস্তারিত লিখুন", "Details")}</span>
            <Textarea required minLength={5} maxLength={4000} rows={6} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("কী পরিবর্তন দরকার, কোন পেজে, কেন", "What needs to change, on which page, and why")} /></label>
          <Button type="submit" disabled={busy} className="gap-1.5"><Send className="size-4" />{role === "admin" ? t("CTO-কে পাঠান", "Send to CTO") : t("অ্যাডমিনকে পাঠান", "Send to admin")}</Button>
        </form>
      )}
      {waiting.length > 0 && <section className="max-w-3xl space-y-3"><h2 className="text-lg font-semibold">{t("আপনার সিদ্ধান্তের অপেক্ষায়", "Waiting for you")} ({waiting.length})</h2>{waiting.map((r) => card(r, true))}</section>}
      <section className="max-w-3xl space-y-3">
        <h2 className="text-lg font-semibold">{t("সকল অনুরোধ", "All requests")}</h2>
        {rest.length === 0 && <p className="text-muted-foreground">{t("কোনো অনুরোধ নেই", "No requests")}</p>}
        {rest.map((r) => card(r, false))}
      </section>
    </div>
  );
}
