import { SomitiLogo } from "@/components/Branding";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { countNewRequests } from "@/lib/requests.functions";
import {
  LayoutDashboard, MapPin, Users, PiggyBank, HandCoins, CalendarClock, Landmark, Receipt, Wallet, FileBarChart, Settings, LogOut, Menu, Calculator, AlertTriangle, Briefcase, Shield, Coins, Upload, ClipboardList, MessageSquare, BookOpen, LoaderCircle, ChevronDown, History,
} from "lucide-react";
import { auth } from "@/lib/app-client";
import { rowQueryOptions, useRows } from "@/lib/db";
import { preloadTables, runPreloadQueue } from "@/lib/preload";
import { bnDate, todayISO } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CenterProvider, CenterSelector, useCenterScope } from "@/components/CenterScope";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { canOpen, homeItem, iconTone, menuDestinations, visibleSections } from "@/components/menu";
import { useAccess } from "@/lib/access";
import { AnnouncementPopup } from "@/components/Announcement";
import { LangToggle, useLang } from "@/lib/i18n";
import { toast } from "sonner";


export function AppShell({ children }: { children: ReactNode }) {
  return <CenterProvider><ShellContent>{children}</ShellContent></CenterProvider>;
}

function ShellContent({ children }: { children: ReactNode }) {
  const { center } = useCenterScope();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const loading = useRouterState({ select: (state) => state.isLoading });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [signingOut, setSigningOut] = useState(false);
  const logoutStarted = useRef(false);
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const access = useAccess();
  const { t } = useLang();
  const menuSections = visibleSections(access);
  const countRequests = useServerFn(countNewRequests);
  const { data: newRequests = 0 } = useQuery({ queryKey: ["change-requests", "new"], queryFn: () => countRequests(), enabled: access.admin || access.cto === true, refetchInterval: 60_000 });
  useEffect(()=>{
    const section=menuSections.find(s=>s.items.some(item=>pathname===item.to||pathname.startsWith(item.to+"/")));
    if(section)setExpanded(previous=>({...previous,[section.key]:true}));
  },[pathname, access.ready]);
  const qc = useQueryClient();
  const router = useRouter();
  const preloadController = useRef<AbortController | null>(null);
  const { data: settings = [] } = useRows("somiti_settings", { order: "id" });
  const name = settings[0]?.name ?? "সমিতি";
  const [user, setUser] = useState<{ full_name?: string; phone?: string; email: string } | null>(null);
  useEffect(() => { void auth.getUser().then(({ data }) => setUser(data.user)); }, []);
  const userName = user?.full_name || (access.admin ? t("অ্যাডমিন", "Admin") : t("ব্যবহারকারী", "User"));
  const roleLabel = access.cto ? "CTO" : access.admin ? "Admin" : "Staff";
  const initial = userName.trim().charAt(0) || "অ";

  useEffect(() => {
    const controller = new AbortController();
    preloadController.current = controller;
    // Let the current screen paint before warming the remaining menus.
    const timer = window.setTimeout(() => {
      void runPreloadQueue(menuDestinations.filter((to) => canOpen(access, to)).map((to) => () => router.preloadRoute({ to })), controller.signal, 1);
      void runPreloadQueue(preloadTables.map((table) => () => qc.prefetchQuery(rowQueryOptions(table))), controller.signal);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, router, access.ready]);

  async function signOut() {
    if (logoutStarted.current) return;
    logoutStarted.current = true;
    setSigningOut(true);
    setOpen(false);
    preloadController.current?.abort();
    try {
      // Paint feedback before clearing the session; never delay the auth operation.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await qc.cancelQueries();
      qc.clear();
      sessionStorage.removeItem("somiti-announcement-checked");
      await auth.signOut();
      await navigate({ to: "/auth", replace: true });
    } catch {
      logoutStarted.current = false;
      setSigningOut(false);
      toast.error(t("লগআউট হয়নি, আবার চেষ্টা করুন", "Could not log out. Please try again."));
    }
  }

  const nav = (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-3">
        <div className="nav-brand rounded-2xl border border-sidebar-border px-4 py-5 text-center shadow-card">
          <div className="nav-teal mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl">
            <SomitiLogo className="size-10" />
          </div>
          <p className="font-display text-base font-semibold leading-snug">{t(name, "Sonali Savings & Credit Co-operative Society Ltd.")}</p>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border-l-4 border-sidebar-ring bg-sidebar-accent px-3 py-2.5 font-semibold">
          <Menu className="size-4" /> {t("প্রধান মেনু তালিকা", "Main Menu")}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 pb-3">
        {!access.cto && <Link to={homeItem.to} onClick={() => setOpen(false)} aria-current={pathname === homeItem.to ? "page" : undefined} className={"nav-item flex min-h-12 items-center gap-3 rounded-lg bg-card px-3 py-2 font-semibold text-card-foreground shadow-card " + (pathname === homeItem.to ? "ring-2 ring-nav-rail" : "")}>
          <homeItem.icon className="size-5 text-success" />{t(homeItem.label, homeItem.en)}
        </Link>}
        {menuSections.map((section) => {
          const isOpen = expanded[section.key] === true;
          return (
          <section key={section.key} aria-label={t(section.label, section.en)}>
            <h2><Button variant="ghost" type="button" aria-expanded={isOpen} aria-controls={`menu-${section.key}`} onClick={()=>setExpanded(previous=>({...previous,[section.key]:!isOpen}))} className="nav-pill h-auto min-h-12 w-full justify-start gap-3 whitespace-normal rounded-lg px-3 py-2 text-left font-semibold">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-foreground/20"><section.icon className="size-4" /></span>
              <span className="flex-1">{t(section.label, section.en)}</span>
              <span className="flex size-7 items-center justify-center rounded-full bg-sidebar-foreground/20"><ChevronDown className={isOpen?"size-4 transition-transform":"size-4 -rotate-90 transition-transform"}/></span>
            </Button></h2>
            <div id={`menu-${section.key}`} className="nav-submenu" data-open={isOpen} inert={!isOpen} aria-hidden={!isOpen}>
            <div className="min-h-0 overflow-hidden"><div className="ml-2 mt-1.5 space-y-1.5 rounded-b-lg border-l-2 border-nav-rail pb-1 pl-2">
        {section.items.map((m, index) => {
          const active = pathname === m.to || (m.to === "/members" && pathname.startsWith("/members/"));
          return (
          <Link
            key={m.to}
            to={m.to}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={"nav-item flex min-h-10 items-center gap-3 rounded-lg bg-card px-3 py-2 text-sm text-card-foreground shadow-card hover:bg-secondary " + (active ? "ring-2 ring-nav-rail font-semibold" : "")}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted"><m.icon className={"size-4 " + iconTone(index)} /></span>
            {t(m.label, m.en)}
          </Link>
          );
        })}
            </div></div></div>
          </section>
          );
        })}
        {access.cto && <Link to="/activity" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl bg-card px-3 py-2 font-semibold text-card-foreground shadow-card hover:bg-secondary"><History className="size-5 text-primary" />{t("অ্যাক্টিভিটি লগ", "Activity Log")}</Link>}
        {<Link to="/requests" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl bg-card px-3 py-2 font-semibold text-card-foreground shadow-card hover:bg-secondary">
          <MessageSquare className="size-5 text-gold" /><span className="flex-1">{access.cto ? t("অনুরোধসমূহ (CTO)", "Requests (CTO)") : t("পরিবর্তনের অনুরোধ (Changes needed)", "Changes needed")}</span>
          {newRequests > 0 && <span aria-label={t("নতুন অনুরোধ", "New requests")} className="flex min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">{newRequests}</span>}
        </Link>}
        <Button variant="ghost" disabled={signingOut} onClick={signOut} className="min-h-12 w-full justify-start gap-3 rounded-xl bg-card px-3 font-semibold text-card-foreground shadow-card hover:bg-secondary">
          <LogOut className="size-5 text-destructive" /> {t("লগ আউট", "Log out")}
        </Button>
      </div>
    </nav>
  );

  const profile = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" type="button" className="h-auto shrink-0 gap-2 rounded-full p-1 text-left hover:bg-muted" aria-label="প্রোফাইল">
          <span className="nav-teal flex size-10 items-center justify-center rounded-full border-2 border-secondary font-semibold">{initial}</span>
          <span className="hidden leading-tight sm:block"><span className="block text-sm font-semibold">{userName}</span><span className="flex items-center gap-1 text-xs text-muted-foreground">{roleLabel} <ChevronDown className="size-3" /></span></span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 overflow-hidden p-0">
        <div className="profile-card space-y-3 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full border border-sidebar-foreground/40 bg-sidebar-foreground/15 text-lg font-semibold">{initial}</span>
            <div><p className="font-semibold">{userName}</p><span className="rounded bg-sidebar-foreground/20 px-2 py-0.5 text-xs">{roleLabel}</span></div>
          </div>
          <div className="space-y-1 border-t border-sidebar-foreground/20 pt-3 text-sm">
            <p className="flex justify-between gap-2"><span>{t("শাখা:", "Branch:")}</span><span className="text-right font-semibold">{name}</span></p>
            {user?.phone && <p className="flex justify-between"><span>{t("মোবাইল:", "Mobile:")}</span><span className="font-semibold">{user.phone}</span></p>}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-foreground/30 px-3 py-0.5 text-xs"><span className="size-2 rounded-full bg-success" />{t("অনলাইন", "Online")}</span>
        </div>
        <div className="p-1">
          {access.admin && <DropdownMenuItem asChild className="min-h-11 text-sm"><Link to="/settings"><Settings className="size-4 text-primary" />{t("প্রোফাইল ও পাসওয়ার্ড এডিট", "Profile & Password")}</Link></DropdownMenuItem>}
          {access.admin && <DropdownMenuItem asChild className="min-h-11 text-sm"><Link to="/users"><Users className="size-4 text-primary" />{t("ইউজার ম্যানেজমেন্ট", "User Management")}</Link></DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={signingOut} onSelect={signOut} className="min-h-11 text-sm text-destructive focus:text-destructive"><LogOut className="size-4" />{t("লগ আউট", "Log out")}</DropdownMenuItem>
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
            <p className="text-xs text-muted-foreground">{t("আজকের তারিখ", "Today")}</p>
            <p className="text-sm font-semibold">{bnDate(todayISO())}</p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <LoaderCircle aria-label="পৃষ্ঠা লোড হচ্ছে" className="size-5 shrink-0 animate-spin text-primary" />}
            <span className="hidden max-w-xs truncate rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-sm text-success md:inline">{name}</span>
            <LangToggle />
            {profile}
          </div>
          <div className="col-span-full flex min-w-0 items-center gap-3"><span className="shrink-0 text-sm text-muted-foreground">{t("কেন্দ্র", "Center")}</span><CenterSelector /></div>
        </header>
        <main key={`${pathname}-${center}`} aria-busy={loading || signingOut} className={"page-transition min-w-0 p-4 md:p-6 " + (signingOut ? "session-leaving" : "")}>{children}</main>
        <AnnouncementPopup />
      </div>
      {loading && <div className="no-print route-progress fixed inset-x-0 top-0 z-50 h-1 bg-nav-rail" role="progressbar" aria-label={t("পৃষ্ঠা লোড হচ্ছে", "Loading page")} />}
      {signingOut && <div className="no-print logout-overlay fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-6" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="logout-icon flex size-20 items-center justify-center rounded-full bg-secondary text-primary"><LogOut className="size-9" /></span>
          <p className="text-xl font-semibold">{t("লগআউট হচ্ছে…", "Logging out…")}</p>
          <LoaderCircle className="size-5 animate-spin text-primary" />
        </div>
      </div>}
    </div>
  );
}
