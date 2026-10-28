import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ctoListUsers, ctoResetPassword, ctoUpdateOwnLogin } from "@/lib/auth.functions";
import { useLang } from "@/lib/i18n";

/** CTO-only: reset any login's password and change the CTO's own login. No somiti data here. */
export function CtoTools() {
  const { t } = useLang();
  const list = useServerFn(ctoListUsers);
  const reset = useServerFn(ctoResetPassword);
  const own = useServerFn(ctoUpdateOwnLogin);
  const { data: users = [] } = useQuery({ queryKey: ["cto", "users"], queryFn: () => list() });
  const [pw, setPw] = useState<Record<string, string>>({});
  const [me, setMe] = useState({ current: "", phone: "", next: "" });
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await fn(); toast.success(ok); } catch (e) { toast.error(e instanceof Error ? e.message : t("হয়নি", "Failed")); } finally { setBusy(false); }
  }

  return (
    <div className="grid max-w-5xl gap-5 lg:grid-cols-2">
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
