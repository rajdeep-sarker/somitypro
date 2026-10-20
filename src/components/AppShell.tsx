import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, MapPin, Users, PiggyBank, HandCoins, CalendarClock, Landmark, Receipt, Wallet, FileBarChart, Settings, LogOut, Menu, Calculator, AlertTriangle, Briefcase, Shield, Coins, Upload, ClipboardList, MessageSquare, BookOpen, LoaderCircle, ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/app-client";
import { rowQueryOptions, useRows } from "@/lib/db";
import { preloadTables, runPreloadQueue } from "@/lib/preload";
import { bnDate, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CenterProvider, CenterSelector } from "@/components/CenterScope";

const menuSections = [
  { label: "সারসংক্ষেপ", items: [
  { to: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  ] },
  { label: "সদস্য ও কেন্দ্র", items: [
  { to: "/centers", label: "এরিয়া / কেন্দ্র সেটআপ", icon: MapPin },
  { to: "/members", label: "সদস্য ব্যবস্থাপনা", icon: Users },
  { to: "/import", label: "এক্সেল সদস্য আমদানি", icon: Upload },
  ] },
  { label: "সঞ্চয় ও ঋণ", items: [
  { to: "/savings", label: "সঞ্চয় ব্যবস্থাপনা", icon: PiggyBank },
  { to: "/loans", label: "লোন ব্যবস্থাপনা", icon: HandCoins },
  { to: "/dps", label: "DPS ব্যবস্থাপনা", icon: CalendarClock },
  { to: "/fdr", label: "FDR ব্যবস্থাপনা", icon: Landmark },
  ] },
  { label: "কালেকশন", items: [
  { to: "/loans/collect", label: "লোন কিস্তি কালেকশন", icon: Receipt },
  { to: "/loans/due", label: "আজকের কিস্তি ও বকেয়া", icon: AlertTriangle },
  { to: "/collection", label: "দৈনিক ও বাল্ক কালেকশন", icon: ClipboardList },
  { to: "/fees", label: "সমিতি ফি কালেকশন", icon: Wallet },
  ] },
  { label: "হিসাব ও বিনিয়োগ", items: [
  { to: "/cash", label: "জমা খরচ ব্যবস্থাপনা", icon: Calculator },
  { to: "/shares", label: "শেয়ার ব্যবস্থাপনা", icon: Coins },
  { to: "/investments", label: "বিনিয়োগ ও প্রকল্প", icon: Briefcase },
  { to: "/fund", label: "বীমা / নিরাপত্তা তহবিল", icon: Shield },
  { to: "/banks", label: "ব্যাংক হিসাব", icon: Landmark },
  ] },
  { label: "রিপোর্ট ও রসিদ", items: [
  { to: "/reports", label: "সমিতির রিপোর্ট", icon: FileBarChart },
  { to: "/receipts", label: "লেনদেন রসিদ", icon: Receipt },
  ] },
  { label: "প্রশাসন ও যোগাযোগ", items: [
  { to: "/staff", label: "কর্মী, হাজিরা ও বেতন", icon: Users },
  { to: "/notifications", label: "SMS ও ইমেইল বার্তা", icon: MessageSquare },
  { to: "/rules", label: "নিয়ম ও নীতিমালা", icon: BookOpen },
  { to: "/settings", label: "সেটিং", icon: Settings },
  ] },
] as const;

const menu = menuSections.flatMap((section) => [...section.items]);

export function AppShell({ children }: { children: ReactNode }) {
  return <CenterProvider><ShellContent>{children}</ShellContent></CenterProvider>;
}

function ShellContent({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const loading = useRouterState({ select: (state) => state.isLoading });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  useEffect(()=>{
    const section=menuSections.find(s=>s.items.some(item=>pathname===item.to||pathname.startsWith(item.to+"/")));
    if(section)setExpanded(previous=>({...previous,[section.label]:true}));
  },[pathname]);
  const qc = useQueryClient();
  const router = useRouter();
  const preloadController = useRef<AbortController | null>(null);
  const { data: settings = [] } = useRows("somiti_settings", { order: "id" });
  const name = settings[0]?.name ?? "সমিতি";

  useEffect(() => {
    const controller = new AbortController();
    preloadController.current = controller;
    // Let the current screen paint before warming the remaining menus.
    const timer = window.setTimeout(() => {
      void runPreloadQueue(menu.map((item) => () => router.preloadRoute({ to: item.to })), controller.signal, 1);
      void runPreloadQueue(preloadTables.map((table) => () => qc.prefetchQuery(rowQueryOptions(table))), controller.signal);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [qc, router]);

  async function signOut() {
    preloadController.current?.abort();
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
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
        {menuSections.map((section) => (
          <section key={section.label} aria-label={section.label} className="border-t border-sidebar-border pt-3 first:border-t-0 first:pt-0">
            <h2><Button variant="ghost" aria-expanded={expanded[section.label]===true} onClick={()=>setExpanded({...expanded,[section.label]:!expanded[section.label]})} className="mb-1 h-11 w-full justify-between px-3 text-sm font-semibold text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-primary">{section.label}<ChevronDown className={expanded[section.label]?"size-4 rotate-180 transition-transform":"size-4 transition-transform"}/></Button></h2>
            {expanded[section.label]&&<div className="space-y-0.5">
        {section.items.map((m) => (
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
            </div>}
          </section>
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
          <div className="col-span-full flex min-w-0 items-center gap-3"><span className="shrink-0 text-sm text-muted-foreground">কেন্দ্র</span><CenterSelector /></div>
        </header>
        <main key={pathname} className="page-transition min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
