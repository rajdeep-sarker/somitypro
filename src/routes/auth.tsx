import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 11) { toast.error("সঠিক মোবাইল নম্বর দিন"); return; }
    setBusy(true);
    const email = phoneToEmail(phone);
    const res =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: name, phone }, emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (res.error) { toast.error(mode === "login" ? "মোবাইল নম্বর বা পাসওয়ার্ড ভুল" : res.error.message); return; }
    if (!res.data.session) { toast.success("অ্যাকাউন্ট তৈরি হয়েছে, এখন লগইন করুন"); return; }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-gold text-sidebar-primary-foreground">
            <Landmark className="size-7" />
          </div>
          <h1 className="font-display text-xl">সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "আপনার অ্যাকাউন্টে লগইন করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <Field label="আপনার নাম">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
          )}
          <Field label="মোবাইল নম্বর">
            <Input inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </Field>
          <Field label="পাসওয়ার্ড">
            <Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "অপেক্ষা করুন..." : mode === "login" ? "লগইন" : "অ্যাকাউন্ট তৈরি"}
          </Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-primary hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "আগেই অ্যাকাউন্ট আছে? লগইন করুন"}
        </button>
      </div>
    </div>
  );
}
