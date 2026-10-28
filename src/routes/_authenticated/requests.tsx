import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/kit";
import { listChangeRequests, submitChangeRequest } from "@/lib/requests.functions";
import { useLang } from "@/lib/i18n";
import { bnDate } from "@/lib/format";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/requests")({ head: () => pageHead("পরিবর্তনের অনুরোধ"), component: Requests });

function Requests() {
  const { t } = useLang();
  const qc = useQueryClient();
  const submit = useServerFn(submitChangeRequest);
  const list = useServerFn(listChangeRequests);
  const { data: rows = [] } = useQuery({ queryKey: ["change-requests"], queryFn: () => list() });
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await submit({ data: { title, details } });
      setTitle(""); setDetails("");
      toast.success(t("অনুরোধ পাঠানো হয়েছে", "Request sent"));
      await qc.invalidateQueries({ queryKey: ["change-requests"] });
    } catch (err) { toast.error(err instanceof Error ? err.message : t("পাঠানো যায়নি", "Could not send")); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("পরিবর্তনের অনুরোধ (Changes needed)", "Changes needed")} subtitle={t("সফটওয়্যারে কী পরিবর্তন বা নতুন সুবিধা দরকার লিখে পাঠান", "Write what should change or be added to the software")} />
      <form onSubmit={send} className="max-w-3xl space-y-4 rounded-2xl border bg-card p-5 shadow-card">
        <label className="block space-y-1"><span className="text-sm font-medium">{t("বিষয়", "Subject")}</span>
          <Input required minLength={2} maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("যেমন: লোন রিপোর্টে নতুন কলাম", "e.g. New column in loan report")} /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">{t("বিস্তারিত লিখুন", "Details")}</span>
          <Textarea required minLength={5} maxLength={4000} rows={7} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("কী পরিবর্তন দরকার, কোন পেজে, কেন — বিস্তারিত লিখুন", "What needs to change, on which page, and why")} /></label>
        <Button type="submit" disabled={busy} className="gap-1.5"><Send className="size-4" />{t("অনুরোধ পাঠান", "Send request")}</Button>
      </form>
      <section className="max-w-3xl space-y-3">
        <h2 className="text-lg font-semibold">{t("পাঠানো অনুরোধ", "Sent requests")}</h2>
        {rows.length === 0 && <p className="text-muted-foreground">{t("এখনো কোনো অনুরোধ নেই", "No requests yet")}</p>}
        {rows.map((r) => (
          <article key={r.id} className="rounded-xl border bg-card p-4 shadow-card">
            <p className="flex items-center gap-2 font-semibold"><MessageSquarePlus className="size-4 text-primary" />{r.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{r.details}</p>
            <p className="mt-2 text-xs text-muted-foreground">{r.user_name} · {bnDate(r.created_at.slice(0, 10))}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
