import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { useRows } from "@/lib/db";
import { resetAccountPassword } from "@/lib/auth.functions";
import { FormCard, Field, SimpleSelect } from "./kit";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

export function AdminPasswordReset({ currentUserId }: { currentUserId: string }) {
  useLang();

  const { data: roles = [] } = useRows("user_roles");
  const admin = roles.some(r => r.user_id === currentUserId && r.role === "admin");
  return admin ? <ResetForm currentUserId={currentUserId} /> : null;
}
function ResetForm({ currentUserId }: { currentUserId: string }) {
  useLang();

  const { data: profiles = [] } = useRows("profiles");
  const reset = useServerFn(resetAccountPassword);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!verified || !userId) return;
    if (password !== confirm) { toast.error(uiText("দুই পাসওয়ার্ড মিলছে না")); return; }
    setBusy(true);
    try {
      await reset({ data: { userId, password } });
      setPassword(""); setConfirm(""); setVerified(false);
      toast.success(uiText("পাসওয়ার্ড রিসেট হয়েছে। নতুন পাসওয়ার্ডটি সংশ্লিষ্ট ব্যক্তিকে নিরাপদে দিন"));
    } catch (e) { toast.error(e instanceof Error ? e.message : uiText("পাসওয়ার্ড রিসেট হয়নি")); }
    finally { setBusy(false); }
  }
  return <FormCard title={uiText("অ্যাকাউন্টের পাসওয়ার্ড রিসেট (অ্যাডমিন)")} onSubmit={submit}>
    <Field label={uiText("অ্যাকাউন্ট")} className="sm:col-span-2"><SimpleSelect value={userId} onChange={v => { setUserId(v); setVerified(false); }} options={profiles.filter(p => p.id !== currentUserId).map(p => ({ value: p.id, label: `${p.full_name || uiText("অ্যাকাউন্ট")} — ${p.phone || uiText("নম্বর নেই")}` }))} /></Field>
    <Field label={uiText("নতুন পাসওয়ার্ড")}><Input aria-label={uiText("রিসেটের নতুন পাসওয়ার্ড")} type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} /></Field>
    <Field label={uiText("পাসওয়ার্ড আবার দিন")}><Input aria-label={uiText("রিসেটের পাসওয়ার্ড আবার দিন")} type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></Field>
    <label className="flex items-center gap-3 text-sm sm:col-span-2"><Checkbox checked={verified} onCheckedChange={v => setVerified(v === true)} />{uiText("আমি এই ব্যক্তির পরিচয় যাচাই করেছি")}</label>
    <Button type="submit" disabled={busy || !userId || !verified}><KeyRound className="size-4" />{busy ? uiText("অপেক্ষা করুন...") : uiText("পাসওয়ার্ড রিসেট করুন")}</Button>
  </FormCard>;
}