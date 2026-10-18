import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, MapPin, Users, PiggyBank, HandCoins, CalendarClock, Landmark, Receipt, Wallet, FileBarChart, Settings, LogOut, Menu, X, Calculator, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRows } from "@/lib/db";
import { bnDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

const menu = [
  { to: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { to: "/centers", label: "এরিয়া / কেন্দ্র সেটআপ", icon: MapPin },
  { to: "/members", label: "সদস্য ব্যবস্থাপনা", icon: Users },
  { to: "/savings", label: "সঞ্চয় ব্যবস্থাপনা", icon: PiggyBank },
  { to: "/loans", label: "লোন ব্যবস্থাপনা", icon: HandCoins },
  { to: "/loans/collect", label: "লোন কিস্তি কালেকশন", icon: Receipt },
  { to: "/loans/due", label: "আজকের কিস্তি ও বকেয়া", icon: AlertTriangle },
  { to: "/dps", label: "DPS ব্যবস্থাপনা", icon: CalendarClock },
  { to: "/fdr", label: "FDR ব্যবস্থাপনা", icon: Landmark },
  { to: "/fees", label: "সমিতি ফি কালেকশন", icon: Wallet },
  { to: "/cash", label: "জমা খরচ ব্যবস্থাপনা", icon: Calculator },
  { to: "/reports", label: "সমিতির রিপোর্ট", icon: FileBarChart },
  { to: "/settings", label: "সেটিং", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: settings = [] } = useRows("somiti_settings", { order: "id" });
  const name = settings[0]?.name ?? "সমিতি";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-gold text-sidebar-primary-foreground">
          <Landmark className="size-6" />
        </div>
        <p className="font-display text-base leading-snug">{name}</p>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {menu.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact: m.to === "/loans" }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary" }}
          >
            <m.icon className="size-4 shrink-0" />
            {m.label}
          </Link>
        ))}
      </div>
      <button onClick={signOut} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-sidebar-accent">
        <LogOut className="size-4" /> লগ আউট
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 lg:block">{nav}</aside>
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72">{nav}</aside>
          <button className="absolute right-4 top-4 rounded-full bg-card p-2" onClick={() => setOpen(false)} aria-label="বন্ধ">
            <X className="size-5" />
          </button>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="মেনু">
            <Menu className="size-5" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground">আজকের তারিখ</p>
            <p className="text-sm font-semibold">{bnDate(todayISO())}</p>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
