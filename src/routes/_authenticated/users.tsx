import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, UserCog, KeyRound, Eye, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/kit";
import { menuSections } from "@/components/menu";
import { useRows } from "@/lib/db";
import { deleteRow, upsertRow } from "@/lib/data.functions";
import { createStaffLogin } from "@/lib/auth.functions";
import { useLang } from "@/lib/i18n";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/users")({ head: () => pageHead("ইউজার ম্যানেজমেন্ট"), component: Users });

// Sections a staff user can be given; settings stays with the administrator.
const SECTIONS = menuSections.filter((s) => s.key !== "settings");
const ROLES: { id: string; bn: string; en: string; view: string[]; write: string[] }[] = [
  { id: "field", bn: "মাঠকর্মী", en: "Field officer", view: ["members", "savings", "loans", "dps"], write: ["savings", "loans", "dps"] },
  { id: "cashier", bn: "ক্যাশিয়ার", en: "Cashier", view: ["members", "savings", "loans", "dps", "fdr", "cash", "banks"], write: ["savings", "loans", "dps", "fdr", "cash", "banks"] },
  { id: "accountant", bn: "হিসাবরক্ষক", en: "Accountant", view: ["cash", "banks", "reports", "accounts", "shares", "investments", "fund"], write: ["cash", "banks"] },
  { id: "viewer", bn: "শুধু রিপোর্ট দেখা", en: "Reports only", view: ["reports", "accounts"], write: [] },
];

function Users() {
  const { t } = useLang();
  const qc = useQueryClient();
  const login = useServerFn(createStaffLogin);
  const { data: staff = [] } = useRows("staff");
  const { data: perms = [] } = useRows("staff_permissions");
  const { data: roles = [] } = useRows("user_roles");
  const [sel, setSel] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const person = staff.find((s) => s.id === sel);
  const uid = person?.user_id ?? "";
  const mine = perms.filter((p) => p.user_id === uid);
  const perm = (k: string) => mine.find((p) => p.module === k);
  const isAdmin = (userId: string | null) => !!userId && roles.some((r) => r.user_id === userId && r.role === "admin");

  async function set(k: string, view: boolean, write: boolean) {
    const existing = perm(k);
    if (view) await upsertRow({ data: { table: "staff_permissions", keys: ["user_id", "module"], values: { user_id: uid, module: k, can_write: write } } });
    else if (existing) await deleteRow({ data: { table: "staff_permissions", id: existing.id } });
  }
  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    try { await fn(); await qc.invalidateQueries({ queryKey: ["t", "staff_permissions"] }); toast.success(ok); }
    catch (e) { toast.error(e instanceof Error ? e.message : t("পরিবর্তন হয়নি", "Change failed")); }
    finally { setBusy(false); }
  }
  const applyRole = (r: (typeof ROLES)[number]) => run(async () => {
    for (const s of SECTIONS) await set(s.key, r.view.includes(s.key), r.write.includes(s.key));
  }, t(`${r.bn} রোল দেওয়া হয়েছে`, `${r.en} role applied`));

  async function provision() {
    setBusy(true);
    try { await login({ data: { staffId: sel, phone, password: pw } }); setPw(""); toast.success(t("লগইন তৈরি হয়েছে", "Login created")); await qc.invalidateQueries({ queryKey: ["t", "staff"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : t("লগইন তৈরি হয়নি", "Could not create login")); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("ইউজার ম্যানেজমেন্ট", "User Management")} subtitle={t("কে কোন অংশ দেখতে ও এন্ট্রি করতে পারবে তা ঠিক করুন — শুধু অ্যাডমিন", "Decide who can view and enter data in each section — admin only")} />
      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-2 rounded-2xl border bg-card p-3 shadow-card">
          <p className="px-2 text-sm font-semibold text-muted-foreground">{t("কর্মী / ইউজার", "Staff / Users")}</p>
          {staff.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t("আগে কর্মী যোগ করুন", "Add staff first")}</p>}
          {staff.map((s) => {
            const count = perms.filter((p) => p.user_id === s.user_id).length;
            return (
              <button key={s.id} type="button" onClick={() => { setSel(s.id); setPhone(s.phone ?? ""); }}
                className={"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors " + (sel === s.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">{s.name.charAt(0)}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{s.name}</span>
                  <span className="block text-xs opacity-80">{!s.user_id ? t("লগইন নেই", "No login") : isAdmin(s.user_id) ? "Admin" : t(`${count}টি অংশের অনুমতি`, `${count} section(s)`)}</span></span>
              </button>
            );
          })}
        </aside>

        <section className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
          {!person ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground"><UserCog className="size-10" />{t("বাম পাশ থেকে একজন কর্মী বেছে নিন", "Choose a staff member on the left")}</div>
          ) : !uid ? (
            <form className="max-w-md space-y-4" onSubmit={(e) => { e.preventDefault(); void provision(); }}>
              <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="size-5 text-primary" />{person.name} — {t("লগইন তৈরি করুন", "Create login")}</h2>
              <label className="block space-y-1"><span className="text-sm font-medium">{t("মোবাইল নম্বর", "Mobile number")}</span><Input required pattern="01[0-9]{9}" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
              <label className="block space-y-1"><span className="text-sm font-medium">{t("পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)", "Password (min 8 characters)")}</span><Input type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
              <Button type="submit" disabled={busy}>{t("লগইন তৈরি করুন", "Create login")}</Button>
            </form>
          ) : isAdmin(uid) ? (
            <p className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="size-5 text-success" />{t("ইনি অ্যাডমিন — সব কিছুতে পূর্ণ অনুমতি আছে", "This user is the admin and has full access")}</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">{person.name} — {t("রোল ও অনুমতি", "Role & permissions")}</h2>
                <p className="text-sm text-muted-foreground">{t("রোল বেছে নিলে নিচের অনুমতি একসাথে বসে যাবে; চাইলে আলাদা করে বদলাতে পারবেন। ইউজার ম্যানেজমেন্ট ও সেটিং সবসময় শুধু অ্যাডমিনের।", "Pick a role to fill permissions at once, then adjust individually. User Management and Settings always stay admin-only.")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => <Button key={r.id} variant="outline" disabled={busy} onClick={() => void applyRole(r)}>{t(r.bn, r.en)}</Button>)}
                <Button variant="outline" disabled={busy} className="text-destructive" onClick={() => void run(async () => { for (const s of SECTIONS) await set(s.key, false, false); }, t("সব অনুমতি বন্ধ", "All access removed"))}>{t("সব বন্ধ", "Remove all")}</Button>
              </div>
              <div className="overflow-hidden rounded-xl border">
                <div className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] bg-muted px-4 py-2 text-sm font-semibold">
                  <span>{t("অংশ", "Section")}</span><span className="flex items-center justify-center gap-1"><Eye className="size-4" />{t("দেখা", "View")}</span><span className="flex items-center justify-center gap-1"><PencilLine className="size-4" />{t("এন্ট্রি", "Entry")}</span>
                </div>
                {SECTIONS.map((s) => {
                  const p = perm(s.key);
                  return (
                    <div key={s.key} className="grid grid-cols-[minmax(0,1fr)_6rem_6rem] items-center border-t px-4 py-2.5">
                      <span className="flex items-center gap-2"><s.icon className="size-4 text-primary" />{t(s.label, s.en)}</span>
                      <span className="flex justify-center"><Checkbox aria-label={`${s.label} view`} checked={!!p} disabled={busy} onCheckedChange={(v) => void run(() => set(s.key, v === true, false), t("অনুমতি বদলেছে", "Updated"))} /></span>
                      <span className="flex justify-center"><Checkbox aria-label={`${s.label} entry`} checked={p?.can_write ?? false} disabled={busy} onCheckedChange={(v) => void run(() => set(s.key, true, v === true), t("অনুমতি বদলেছে", "Updated"))} /></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
