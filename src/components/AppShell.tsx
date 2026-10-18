import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, MapPin, Users, PiggyBank, HandCoins, CalendarClock, Landmark, Receipt, Wallet, FileBarChart, Settings, LogOut, Menu, Calculator, AlertTriangle, Briefcase, Shield, Coins, Upload, ClipboardList, MessageSquare, BookOpen, LoaderCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRows } from "@/lib/db";
import { bnDate, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  { to: "/shares", label: "শেয়ার ব্যবস্থাপনা", icon: Coins },
  { to: "/investments", label: "বিনিয়োগ ও প্রকল্প", icon: Briefcase },
  { to: "/fund", label: "বীমা / নিরাপত্তা তহবিল", icon: Shield },
  { to: "/banks", label: "ব্যাংক হিসাব", icon: Landmark },
  { to: "/staff", label: "কর্মী, হাজিরা ও বেতন", icon: Users },
  { to: "/import", label: "এক্সেল সদস্য আমদানি", icon: Upload },
  { to: "/collection", label: "দৈনিক ও বাল্ক কালেকশন", icon: ClipboardList },
  { to: "/notifications", label: "SMS ও ইমেইল বার্তা", icon: MessageSquare },
  { to: "/rules", label: "নিয়ম ও নীতিমালা", icon: BookOpen },
  { to: "/reports", label: "সমিতির রিপোর্ট", icon: FileBarChart },
  { to: "/receipts", label: "লেনদেন রসিদ", icon: Receipt },
  { to: "/settings", label: "সেটিং", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const loading = useRouterState({ select: (state) => state.isLoading });
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
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary" }}
          >
            <m.icon className="size-4 shrink-0" />
            {m.label}
          </Link>
        ))}
      </div>
      <Button variant="ghost" onClick={signOut} className="m-3 justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
        <LogOut className="size-4" /> লগ আউট
      </Button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 lg:block">{nav}</aside>
      <div className="min-w-0 lg:pl-64">
        <header className="no-print sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="মেনু"><Menu className="size-5" /></Button></SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined} className="no-print w-72 max-w-[85vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground data-[state=open]:duration-150 data-[state=closed]:duration-100 motion-reduce:animate-none lg:hidden">
              <SheetTitle className="sr-only">সমিতির মেনু</SheetTitle>{nav}
            </SheetContent>
          </Sheet>
          <div>
            <p className="text-xs text-muted-foreground">আজকের তারিখ</p>
            <p className="text-sm font-semibold">{bnDate(todayISO())}</p>
          </div>
          {loading && <LoaderCircle aria-label="পৃষ্ঠা লোড হচ্ছে" className="size-5 shrink-0 animate-spin text-primary" />}
        </header>
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
