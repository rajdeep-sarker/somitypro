import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, UserCog, Megaphone, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAnnouncement, getAnnouncementAudience, saveAnnouncement, stopAnnouncement } from "@/lib/announcements.functions";
import { Textarea } from "@/components/ui/textarea";
import { ctoListUsers, ctoResetPassword, ctoUpdateOwnLogin } from "@/lib/auth.functions";
import { useLang } from "@/lib/i18n";
import { bn } from "@/lib/format";

/** CTO-only: reset any login's password and change the CTO's own login. No somiti data here. */
export function CtoTools() {
  const { t, lang } = useLang();
  const list = useServerFn(ctoListUsers);
  const reset = useServerFn(ctoResetPassword);
  const own = useServerFn(ctoUpdateOwnLogin);
  const { data: users = [] } = useQuery({ queryKey: ["cto", "users"], queryFn: () => list() });
  const [pw, setPw] = useState<Record<string, string>>({});
  const [me, setMe] = useState({ current: "", phone: "", next: "" });
  const [busy, setBusy] = useState(false);
  const getAnn = useServerFn(getAnnouncement), saveAnn = useServerFn(saveAnnouncement), stopAnn = useServerFn(stopAnnouncement);
  const ann = useQuery({ queryKey: ["cto", "announcement"], queryFn: () => getAnn() });
  const getAudience = useServerFn(getAnnouncementAudience);
  const audience = useQuery({ queryKey: ["cto", "announcement-audience"], queryFn: () => getAudience(), refetchInterval: 60000 });
  const [bannerId, setBannerId] = useState("");
  const selectedBanner = audience.data?.find((a) => a.id === bannerId) ?? audience.data?.[0];
  const [b, setB] = useState({ title: "", message: "", shows: "1" });

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await fn(); toast.success(ok); } catch (e) { toast.error(e instanceof Error ? e.message : t("হয়নি", "Failed")); } finally { setBusy(false); }
  }

  return (
    <div className="grid max-w-5xl gap-5 lg:grid-cols-2">
      <form className="space-y-3 rounded-2xl border-2 border-gold/50 bg-card p-5 shadow-card lg:col-span-2" onSubmit={(e) => { e.preventDefault(); void run(() => saveAnn({ data: { title: b.title, message: b.message, shows: Number(b.shows) } }), t("ব্যানার চালু হয়েছে", "Banner is live")).then(() => { setB({ title: "", message: "", shows: "1" }); void ann.refetch(); }); }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Megaphone className="size-5 text-gold" />{t("ঘোষণা ব্যানার", "Announcement banner")}</h2>
        {ann.data ? <div className="flex flex-wrap items-start gap-3 rounded-xl bg-gold/10 p-3 text-sm"><div className="flex-1"><p className="font-semibold">{t("এখন চালু:", "Live now:")} {ann.data.title}</p><p className="whitespace-pre-wrap">{ann.data.message}</p><p className="text-muted-foreground">{t(`প্রত্যেক ইউজারকে পরের ${ann.data.shows} বার লগইনে দেখাবে`, `Shown on each user's next ${ann.data.shows} login(s)`)}</p></div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void run(() => stopAnn(), t("ব্যানার বন্ধ", "Banner stopped")).then(() => void ann.refetch())}>{t("বন্ধ করুন", "Stop")}</Button></div>
          : <p className="text-sm text-muted-foreground">{t("এখন কোনো ব্যানার চালু নেই", "No banner is live")}</p>}
        <label className="block space-y-1"><span className="text-sm font-medium">{t("শিরোনাম", "Title")}</span><Input required maxLength={150} value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} placeholder={t("যেমন: সিস্টেম নতুন করে চালু হয়েছে", "e.g. The system has been reset")} /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">{t("বার্তা", "Message")}</span><Textarea required maxLength={2000} rows={3} value={b.message} onChange={(e) => setB({ ...b, message: e.target.value })} /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">{t("পরের কতবার লগইনে দেখাবে", "Show on how many next logins")}</span><Input type="number" min={1} max={50} required className="w-32" value={b.shows} onChange={(e) => setB({ ...b, shows: e.target.value })} /></label>
        <Button type="submit" disabled={busy}>{t("ব্যানার চালু করুন", "Publish banner")}</Button>
        <p className="text-xs text-muted-foreground">{t("নতুন ব্যানার দিলে আগেরটা বন্ধ হয়ে যাবে। ইউজার শুধু × চাপলেই এটা বন্ধ হবে।", "Publishing replaces the current banner. Users can only close it with ×.")}</p>
      </form>
      <section className="space-y-4 border-y py-5 lg:col-span-2" aria-label={t("ব্যানার দেখার তালিকা", "Banner audience")}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><Eye className="size-5 text-primary" />{t("ব্যানার কারা দেখেছেন", "Who has seen the banner")}</h2><Button type="button" variant="outline" disabled={audience.isFetching} onClick={() => void audience.refetch()}><RefreshCw className="size-4" />{t("হালনাগাদ", "Refresh")}</Button></div>
        {audience.isPending ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : audience.isError ? <p className="text-destructive">{t("দেখার তালিকা লোড হয়নি। আবার হালনাগাদ করুন।", "Could not load viewers. Please refresh.")}</p> : !selectedBanner ? <p className="text-muted-foreground">{t("কোনো ব্যানার প্রকাশ করা হয়নি", "No banners published yet")}</p> : <>
          <label className="block space-y-1"><span className="text-sm font-medium">{t("ব্যানার", "Banner")}</span><select className="h-10 w-full min-w-0 rounded-md border bg-background px-3" value={selectedBanner.id} onChange={(e) => setBannerId(e.target.value)}>{audience.data?.map((a) => <option key={a.id} value={a.id}>{a.title} — {a.active ? t("চালু", "Live") : t("বন্ধ", "Stopped")}</option>)}</select></label>
          <p className="font-medium">{t("দেখেছেন:", "Viewers:")} {bn(selectedBanner.viewers.length)}</p>
          {!selectedBanner.viewers.length ? <p className="text-muted-foreground">{t("এখনও কেউ এই ব্যানার দেখেননি", "Nobody has seen this banner yet")}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="p-2">{t("ব্যবহারকারী", "User")}</th><th className="p-2">{t("রোল", "Role")}</th><th className="p-2">{t("কতবার", "Times shown")}</th><th className="p-2">{t("শেষ দেখেছেন", "Last shown")}</th></tr></thead><tbody>{selectedBanner.viewers.map((v) => <tr key={v.userId} className="border-b"><td className="p-2"><p className="font-medium">{v.name || t("অপসারিত ব্যবহারকারী", "Removed user")}</p><p className="text-muted-foreground">{v.phone || "—"}</p></td><td className="p-2">{v.role === "admin" ? t("অ্যাডমিন", "Admin") : t("কর্মী", "Staff")}</td><td className="p-2">{bn(v.count)}</td><td className="p-2">{v.lastSeenAt ? new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(v.lastSeenAt)) : t("আগের রেকর্ডে সময় নেই", "Time unavailable in older record")}</td></tr>)}</tbody></table></div>}
        </>}
      </section>
      <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="size-5 text-primary" />{t("ইউজারদের পাসওয়ার্ড রিসেট", "Reset user passwords")}</h2>
        {users.map((u) => (
          <form key={u.id} className="flex flex-wrap items-center gap-2 border-t pt-3" onSubmit={(e) => { e.preventDefault(); void run(() => reset({ data: { userId: u.id, password: pw[u.id] ?? "" } }), t("পাসওয়ার্ড বদলেছে", "Password changed")).then(() => setPw({ ...pw, [u.id]: "" })); }}>
            <div className="min-w-36 flex-1"><p className="font-medium">{u.name || "—"} <span className="text-xs text-muted-foreground">({u.role === "admin" ? "Admin" : "Staff"})</span></p><p className="text-sm text-muted-foreground">{u.phone}</p></div>
            <Input type="password" minLength={8} required className="w-44" placeholder={t("নতুন পাসওয়ার্ড", "New password")} value={pw[u.id] ?? ""} onChange={(e) => setPw({ ...pw, [u.id]: e.target.value })} />
            <Button type="submit" size="sm" disabled={busy}>{t("বদলান", "Change")}</Button>
          </form>
        ))}
      </section>
      <form className="space-y-3 rounded-2xl border bg-card p-5 shadow-card" onSubmit={(e) => { e.preventDefault(); void run(() => own({ data: me }), t("আপনার লগইন হালনাগাদ হয়েছে", "Your login was updated")).then(() => setMe({ current: "", phone: me.phone, next: "" })); }}>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><UserCog className="size-5 text-primary" />{t("আমার লগইন (CTO)", "My login (CTO)")}</h2>
        <label className="block space-y-1"><span className="text-sm font-medium">{t("মোবাইল নম্বর (লগইন আইডি)", "Mobile number (login ID)")}</span><Input required pattern="01[0-9]{9}" value={me.phone} onChange={(e) => setMe({ ...me, phone: e.target.value })} /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">{t("নতুন পাসওয়ার্ড (না বদলালে খালি রাখুন)", "New password (leave blank to keep)")}</span><Input type="password" value={me.next} onChange={(e) => setMe({ ...me, next: e.target.value })} /></label>
        <label className="block space-y-1"><span className="text-sm font-medium">{t("বর্তমান পাসওয়ার্ড", "Current password")}</span><Input type="password" required value={me.current} onChange={(e) => setMe({ ...me, current: e.target.value })} /></label>
        <Button type="submit" disabled={busy}>{t("সংরক্ষণ করুন", "Save")}</Button>
      </form>
    </div>
  );
}
