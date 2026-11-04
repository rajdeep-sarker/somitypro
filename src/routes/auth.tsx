import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { SomitiLogo } from "@/components/Branding";
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/app-client";
import { chooseLoginPersistence, rememberChoiceKey } from "@/lib/login-storage";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kit";
import { phoneToEmail } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "লগইন — সোনালী সমিতি" },
      { name: "description", content: "মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে সমিতি সফটওয়্যারে লগইন করুন।" },
      { property: "og:title", content: "লগইন — সোনালী সমিতি" },
      { property: "og:description", content: "মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে সমিতি সফটওয়্যারে লগইন করুন।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  useLang();

  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    setRemember(localStorage.getItem(rememberChoiceKey) === "true");
    let active = true;
    auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 11) { toast.error(uiText("সঠিক মোবাইল নম্বর দিন")); return; }
    setBusy(true);
    const email = phoneToEmail(phone);
    chooseLoginPersistence(remember, sessionStorage, localStorage);
    const res = await auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error || !res.data.session) { toast.error(uiText("মোবাইল নম্বর বা পাসওয়ার্ড ভুল")); return; }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero p-4">
      <div className="page-transition w-full max-w-md rounded-2xl bg-card p-8 shadow-card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-gold text-sidebar-primary-foreground">
            <SomitiLogo className="size-9" />
          </div>
          <h1 className="font-display text-xl">{uiText("সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{uiText("আপনার অ্যাকাউন্টে লগইন করুন")}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label={uiText("মোবাইল নম্বর")}>
            <Input aria-label={uiText("মোবাইল নম্বর")} autoComplete="username" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </Field>
          <Field label={uiText("পাসওয়ার্ড")}>
            <Input aria-label={uiText("পাসওয়ার্ড")} autoComplete="current-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={remember} onCheckedChange={v => setRemember(v === true)} />Remember Me</label>
            {<Button type="button" variant="link" className="h-auto whitespace-normal p-0 text-sm" onClick={() => setHelp(!help)}>{uiText("পাসওয়ার্ড ভুলে গেছেন?")}</Button>}
          </div>
          {help && <div role="status" className="space-y-2 border-l-2 border-primary bg-secondary p-3 text-sm text-secondary-foreground"><p>{uiText("পাসওয়ার্ড রিসেটের জন্য সমিতির অ্যাডমিনের সঙ্গে যোগাযোগ করুন। আপনার নিবন্ধিত মোবাইল নম্বর ও পরিচয় দিন।")}</p><p>{uiText("পরিচয় যাচাইয়ের পর অ্যাডমিন নতুন পাসওয়ার্ড দেবেন। লগইনের পর সেটিং থেকে নিজের পাসওয়ার্ড পরিবর্তন করুন।")}</p></div>}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? uiText("অপেক্ষা করুন...") : uiText("লগইন")}
          </Button>
        </form>
      </div>
    </div>
  );
}
