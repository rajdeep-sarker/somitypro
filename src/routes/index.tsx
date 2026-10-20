import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/app-client";
import { PiggyBank, HandCoins, CalendarClock, Landmark, FileBarChart, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
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

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gold text-sidebar-primary-foreground">
                <Landmark className="size-5" />
              </div>
              <span className="font-display text-lg">সোনালী সমিতি</span>
            </div>
            <Button asChild variant="secondary">
              <Link to="/auth">লগইন</Link>
            </Button>
          </div>
          <div className="py-16 md:py-24">
            <p className="text-sm uppercase tracking-widest text-sidebar-primary">সমবায় সমিতির জন্য</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
              সোনালী সঞ্চয় ও ঋণদান সমবায় সমিতি লিমিটেড
            </h1>
            <p className="mt-5 max-w-xl text-lg opacity-90">
              সঞ্চয়, ঋণ, DPS, FDR, হিসাব ও সদস্য ব্যবস্থাপনা — এক জায়গায়, নির্ভুল ও নিরাপদ।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-sidebar-primary-foreground hover:opacity-90">
                <Link to="/auth">সফটওয়্যারে প্রবেশ করুন</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm opacity-80">
              <ShieldCheck className="size-4" /> ক্লাউড ভিত্তিক নিরাপদ সেবা
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <f.icon className="size-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
