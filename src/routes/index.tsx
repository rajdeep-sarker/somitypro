import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { SomitiLogo } from "@/components/Branding";
import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { auth } from "@/lib/app-client";
import { publicMemberCount } from "@/lib/data.functions";
import { bn } from "@/lib/format";
import { PiggyBank, HandCoins, CalendarClock, Landmark, FileBarChart, Users, ShieldCheck, ArrowRight, Lock, Smartphone, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/landing-hero.jpg";

const memberCountQuery = {
  queryKey: ["public", "member-count"],
  queryFn: () => publicMemberCount(),
};

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(memberCountQuery),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড" },
      { name: "description", content: "সঞ্চয়, ঋণ, DPS, FDR ও হিসাব — সমিতির সম্পূর্ণ ডিজিটাল ব্যবস্থাপনা।" },
      { property: "og:title", content: "সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড" },
      { property: "og:description", content: "সঞ্চয়, ঋণ, DPS, FDR ও হিসাব — সমিতির সম্পূর্ণ ডিজিটাল ব্যবস্থাপনা।" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Users, t: "সদস্য ব্যবস্থাপনা", d: "সদস্য বিবরণ, নমিনি ও লেনদেন খতিয়ান" },
  { icon: PiggyBank, t: "সঞ্চয় ব্যবস্থাপনা", d: "দৈনিক সঞ্চয় জমা, উত্তোলন ও লভ্যাংশ" },
  { icon: HandCoins, t: "ঋণ ব্যবস্থাপনা", d: "লোন বিতরণ, কিস্তি আদায়, বকেয়া তালিকা" },
  { icon: CalendarClock, t: "DPS ব্যবস্থাপনা", d: "স্কিম, কিস্তি কালেকশন ও মেয়াদ" },
  { icon: Landmark, t: "FDR ব্যবস্থাপনা", d: "স্থায়ী আমানত ও মুনাফা প্রদান" },
  { icon: FileBarChart, t: "রিপোর্ট ও বিশ্লেষণ", d: "দৈনিক কালেকশন, হাতে নগদ, ব্যালেন্স শীট" },
];

const trust = [
  { icon: Lock, t: "নিরাপদ হিসাব", d: "প্রতিটি লেনদেন স্থায়ীভাবে সংরক্ষিত, পরিবর্তনের পূর্ণ লগ" },
  { icon: Smartphone, t: "মোবাইলে ব্যবহারযোগ্য", d: "মাঠ থেকেই কিস্তি আদায় ও জমা" },
  { icon: Languages, t: "বাংলা ও ইংরেজি", d: "এক ক্লিকে ভাষা পরিবর্তন" },
];

function Index() {
  useLang();
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="page-transition min-h-screen bg-background">
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-gold/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-5">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gold text-sidebar-primary-foreground shadow-lg">
                <SomitiLogo className="size-7" />
              </div>
              <span className="font-display text-lg">{uiText("সোনালী সমিতি")}</span>
            </div>
            <Button asChild variant="secondary" className="rounded-full">
              <Link to="/auth">{uiText("লগইন")}</Link>
            </Button>
          </header>

          <div className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-sm">
                <ShieldCheck className="size-4 text-gold" /> {uiText("সমবায় সমিতির জন্য")}
              </span>
              <h1 className="mt-5 font-display text-4xl leading-tight md:text-5xl">
                {uiText("সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড")}
              </h1>
              <p className="mt-5 max-w-xl text-lg opacity-90">
                {uiText("সঞ্চয়, ঋণ, DPS, FDR, হিসাব ও সদস্য ব্যবস্থাপনা — এক জায়গায়, নির্ভুল ও নিরাপদ।")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="group rounded-full bg-gold text-sidebar-primary-foreground hover:opacity-90">
                  <Link to="/auth">
                    {uiText("সফটওয়্যারে প্রবেশ করুন")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-6">
                {([["১৩০০+", "সদস্য"], ["৬+", "সেবা"], ["২৪/৭", "অ্যাক্সেস"]] as const).map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-2xl text-gold">{uiText(n)}</div>
                    <div className="text-sm opacity-80">{uiText(l)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 rotate-2 rounded-3xl bg-gold/30" />
              <img src={hero} width={1280} height={960} alt={uiText("সমিতির সদস্যরা হিসাব দেখছেন")}
                className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl" />
              <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-card">
                <PiggyBank className="size-8 text-primary" />
                <div>
                  <div className="text-sm font-semibold">{uiText("আজকের কালেকশন")}</div>
                  <div className="text-xs text-muted-foreground">{uiText("এক নজরে সব হিসাব")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{uiText("সেবাসমূহ")}</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">{uiText("সমিতির সব কাজ এক সফটওয়্যারে")}</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.t} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{uiText(f.t)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{uiText(f.d)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-3">
          {trust.map((f) => (
            <div key={f.t} className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-sidebar-primary-foreground">
                <f.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{uiText(f.t)}</h3>
                <p className="text-sm text-muted-foreground">{uiText(f.d)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-hero px-6 py-12 text-center text-primary-foreground md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">{uiText("আপনার হিসাব দেখতে প্রস্তুত?")}</h2>
            <p className="mt-2 opacity-85">{uiText("মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন।")}</p>
          </div>
          <Button asChild size="lg" className="rounded-full bg-gold text-sidebar-primary-foreground hover:opacity-90">
            <Link to="/auth">{uiText("লগইন")} <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {uiText("সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড")}
      </footer>
    </div>
  );
}
