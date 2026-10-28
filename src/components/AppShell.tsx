import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, MapPin, Users, PiggyBank, HandCoins, CalendarClock, Landmark, Receipt, Wallet, FileBarChart, Settings, LogOut, Menu, Calculator, AlertTriangle, Briefcase, Shield, Coins, Upload, ClipboardList, MessageSquare, BookOpen, LoaderCircle, ChevronDown,
} from "lucide-react";
import { auth } from "@/lib/app-client";
import { rowQueryOptions, useRows } from "@/lib/db";
import { preloadTables, runPreloadQueue } from "@/lib/preload";
import { bnDate, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CenterProvider, CenterSelector, useCenterScope } from "@/components/CenterScope";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const { center } = useCenterScope();
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
  const [user, setUser] = useState<{ full_name?: string; phone?: string; email: string } | null>(null);
  useEffect(() => { void auth.getUser().then(({ data }) => setUser(data.user)); }, []);
  const userName = user?.full_name || "অ্যাডমিন";
  const initial = userName.trim().charAt(0) || "অ";

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
    await auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-3">
        <div className="nav-brand rounded-2xl border border-sidebar-border px-4 py-5 text-center shadow-card">
          <div className="nav-teal mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl">
            <Landmark className="size-7" />
          </div>
          <p className="font-display text-base font-semibold leading-snug">{name}</p>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border-l-4 border-sidebar-ring bg-sidebar-accent px-3 py-2.5 font-semibold">
          <Menu className="size-4" /> প্রধান মেনু তালিকা
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 pb-3">
        {menuSections.map((section) => {
          const isOpen = expanded[section.label] === true;
          const single = section.items.length === 1 ? section.items[0] : null;
          const SectionIcon = section.items[0].icon;
          if (single) return (
            <Link key={section.label} to={single.to} onClick={() => setOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl bg-card px-3 py-2 font-semibold text-card-foreground shadow-card">
              <span className="nav-teal flex size-8 items-center justify-center rounded-lg"><single.icon className="size-4" /></span>{single.label}
            </Link>
          );
          return (
          <section key={section.label} aria-label={section.label}>
            <h2><button type="button" aria-expanded={isOpen} onClick={()=>setExpanded({...expanded,[section.label]:!isOpen})} className="nav-pill flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-foreground/20"><SectionIcon className="size-4" /></span>
              <span className="flex-1">{section.label}</span>
              <span className="flex size-7 items-center justify-center rounded-full bg-sidebar-foreground/20"><ChevronDown className={isOpen?"size-4 transition-transform":"size-4 -rotate-90 transition-transform"}/></span>
            </button></h2>
            {isOpen&&<div className="mt-1.5 space-y-1 border-l-2 border-sidebar-border pl-3 ml-4">
        {section.items.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact: m.to === "/loans" }}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "bg-card text-card-foreground font-semibold hover:bg-card" }}
          >
            <m.icon className="size-4 shrink-0" />
            {m.label}
          </Link>
        ))}
            </div>}
          </section>
          );
        })}
      </div>
    </nav>
  );

  const profile = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex shrink-0 items-center gap-2 rounded-full p-1 text-left hover:bg-muted" aria-label="প্রোফাইল">
          <span className="nav-teal flex size-10 items-center justify-center rounded-full border-2 border-secondary font-semibold">{initial}</span>
          <span className="hidden leading-tight sm:block"><span className="block text-sm font-semibold">{userName}</span><span className="flex items-center gap-1 text-xs text-muted-foreground">Admin <ChevronDown className="size-3" /></span></span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 overflow-hidden p-0">
        <div className="profile-card space-y-3 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full border border-sidebar-foreground/40 bg-sidebar-foreground/15 text-lg font-semibold">{initial}</span>
            <div><p className="font-semibold">{userName}</p><span className="rounded bg-sidebar-foreground/20 px-2 py-0.5 text-xs">Admin</span></div>
          </div>
          <div className="space-y-1 border-t border-sidebar-foreground/20 pt-3 text-sm">
            <p className="flex justify-between gap-2"><span>শাখা:</span><span className="text-right font-semibold">{name}</span></p>
            {user?.phone && <p className="flex justify-between"><span>মোবাইল:</span><span className="font-semibold">{user.phone}</span></p>}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-foreground/30 px-3 py-0.5 text-xs"><span className="size-2 rounded-full bg-success" />অনলাইন</span>
        </div>
        <div className="p-1">
          <DropdownMenuItem asChild className="min-h-11 text-sm"><Link to="/settings"><Settings className="size-4 text-primary" />প্রোফাইল ও পাসওয়ার্ড এডিট</Link></DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11 text-sm"><Link to="/staff"><Users className="size-4 text-primary" />সকল ব্যবহারকারী ও পদবী</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={signOut} className="min-h-11 text-sm text-destructive focus:text-destructive"><LogOut className="size-4" />লগ আউট</DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-72 lg:block">{nav}</aside>
      <div className="min-w-0 lg:pl-72">
        <header className="no-print sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="shrink-0 lg:hidden" aria-label="মেনু"><Menu className="size-5" /></Button></SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined} className="no-print w-80 max-w-[88vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground data-[state=open]:duration-150 data-[state=closed]:duration-100 motion-reduce:animate-none lg:hidden">
              <SheetTitle className="sr-only">সমিতির মেনু</SheetTitle>{nav}
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">আজকের তারিখ</p>
            <p className="text-sm font-semibold">{bnDate(todayISO())}</p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <LoaderCircle aria-label="পৃষ্ঠা লোড হচ্ছে" className="size-5 shrink-0 animate-spin text-primary" />}
            <span className="hidden max-w-xs truncate rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-sm text-success md:inline">{name}</span>
            {profile}
          </div>
          <div className="col-span-full flex min-w-0 items-center gap-3"><span className="shrink-0 text-sm text-muted-foreground">কেন্দ্র</span><CenterSelector /></div>
        </header>
        <main key={`${pathname}-${center}`} className="page-transition min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
