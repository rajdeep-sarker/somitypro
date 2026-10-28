import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, Star, X, Zap, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { iconTone, visibleSections, type MenuItem } from "@/components/menu";
import { useAccess } from "@/lib/access";
import { useLang } from "@/lib/i18n";
import { bn } from "@/lib/format";

const FAV_KEY = "somiti-favorites";
const QUICK_KEY = "somiti-quick-actions";
type Entry = MenuItem & { section: string; sectionEn: string };

function useStoredList(key: string) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    try { setList(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { setList([]); }
  }, [key]);
  const save = (next: string[]) => { setList(next); localStorage.setItem(key, JSON.stringify(next)); };
  return [list, save] as const;
}

function useEntries() {
  const access = useAccess();
  const sections = useMemo(() => visibleSections(access), [access.admin, access.view.size, access.ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = useMemo<Entry[]>(() => sections.flatMap((s) => s.items.map((m) => ({ ...m, section: s.label, sectionEn: s.en }))), [sections]);
  return { sections, all };
}

/** Admin-chosen shortcuts shown on the dashboard; "Add" opens a picker of every allowed feature. */
export function QuickActions() {
  const { t, lang } = useLang();
  const { all } = useEntries();
  const [picked, setPicked] = useStoredList(QUICK_KEY);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const chosen = picked.map((label) => all.find((m) => m.label === label)).filter((m): m is Entry => !!m);
  const toggle = (label: string) => setPicked(picked.includes(label) ? picked.filter((p) => p !== label) : [...picked, label]);
  const term = q.trim().toLowerCase();
  const options = all.filter((m) => !term || [m.label, m.en, m.section, m.sectionEn].some((x) => x.toLowerCase().includes(term)));

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gold/15"><Zap className="size-5 text-gold" /></span>
          <div>
            <h2 className="text-lg font-semibold">{t("দ্রুত কার্যক্রম", "Quick Actions")}</h2>
            <p className="text-sm text-muted-foreground">{t("সবচেয়ে বেশি ব্যবহৃত কাজগুলো এক ক্লিকে", "Your most-used tasks, one click away")}</p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="size-4" />{t("যোগ করুন", "Add")}</Button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {chosen.map((m, index) => (
          <div key={m.label} className="group relative">
            <Link to={m.to} className="flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 border-primary/15 bg-secondary/40 p-3 text-center transition-transform hover:-translate-y-0.5 hover:shadow-card">
              <m.icon className={"size-8 " + iconTone(index)} />
              <span className="text-sm font-medium leading-snug">{t(m.label, m.en)}</span>
            </Link>
            <button type="button" onClick={() => toggle(m.label)} aria-label={t("সরিয়ে দিন", "Remove")}
              className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-card hover:text-destructive">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setOpen(true)}
          className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Plus className="size-7" />{t("নতুন যোগ করুন", "Add new")}
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b p-5 pb-4">
            <DialogTitle>{t("দ্রুত কার্যক্রমে যোগ করুন", "Add to Quick Actions")}</DialogTitle>
            <DialogDescription>{t(`নির্বাচিত: ${bn(chosen.length)}টি — যেগুলো দরকার সেগুলোতে ক্লিক করুন`, `Selected: ${chosen.length} — click the features you need`)}</DialogDescription>
            <label className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ফিচার খুঁজুন...", "Search features...")} className="rounded-full pl-9" />
            </label>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-1 overflow-y-auto p-3">
            {options.map((m, index) => {
              const on = picked.includes(m.label);
              return (
                <button key={m.section + m.label} type="button" aria-pressed={on} onClick={() => toggle(m.label)}
                  className={"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors " + (on ? "bg-primary/10" : "hover:bg-muted")}>
                  <m.icon className={"size-5 shrink-0 " + iconTone(index)} />
                  <span className="flex-1"><span className="block text-sm font-medium">{t(m.label, m.en)}</span><span className="block text-xs text-muted-foreground">{lang === "en" ? m.sectionEn : m.section}</span></span>
                  <span className={"flex size-6 items-center justify-center rounded-full border " + (on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{on && <Check className="size-4" />}</span>
                </button>
              );
            })}
            {options.length === 0 && <p className="py-8 text-center text-muted-foreground">{t("কিছু পাওয়া যায়নি", "Nothing found")}</p>}
          </div>
          <div className="flex justify-end border-t p-3"><Button onClick={() => setOpen(false)}>{t("সম্পন্ন", "Done")}</Button></div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function DashboardModules() {
  const { t, lang } = useLang();
  const { sections, all } = useEntries();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [favs, setFavs] = useStoredList(FAV_KEY);
  const toggle = (label: string) => setFavs(favs.includes(label) ? favs.filter((f) => f !== label) : [...favs, label]);
  const num = (n: number) => (lang === "en" ? String(n) : bn(n));

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((m) =>
      (tab === "all" || (tab === "fav" ? favs.includes(m.label) : m.section === tab)) &&
      (!term || [m.label, m.en, m.section, m.sectionEn].some((x) => x.toLowerCase().includes(term))));
  }, [q, tab, favs, all]);

  const tabs = [
    { key: "all", label: `${t("সকল", "All")} (${num(all.length)})` },
    { key: "fav", label: `★ ${t("ফেভারিট", "Favorites")} (${num(favs.length)})` },
    ...sections.map((s) => ({ key: s.label, label: `${t(s.label, s.en)} (${num(s.items.length)})` })),
  ];

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("সকল মডিউল", "All Modules")}</h2>
          <p className="text-sm text-muted-foreground">{t("যেকোনো ফিচার খুঁজুন, তারকা চিহ্ন দিয়ে ফেভারিট করুন", "Search any feature, star to favorite")}</p>
        </div>
        <label className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={t("ফিচার খুঁজুন", "Search features")} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ফিচার খুঁজুন... (যেমন: লোন, সঞ্চয়, রিপোর্ট)", "Search... (e.g. loan, savings, report)")} className="rounded-full pl-9" />
        </label>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tb) => (
          <button key={tb.key} type="button" onClick={() => setTab(tb.key)}
            className={"shrink-0 rounded-full px-3 py-1.5 text-sm " + (tab === tb.key ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary")}>
            {tb.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{tab === "fav" ? t("এখনো কোনো ফেভারিট নেই — কার্ডের তারকায় চাপ দিন", "No favorites yet — tap a card's star") : t("কিছু পাওয়া যায়নি", "Nothing found")}</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {items.map((m, index) => {
            const fav = favs.includes(m.label);
            return (
              <div key={m.section + m.label} className="relative">
                <Link to={m.to} className="flex h-full min-h-28 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center transition-transform hover:-translate-y-0.5 hover:shadow-card">
                  <m.icon className={"size-9 " + iconTone(index)} />
                  <span className="text-sm leading-snug">{t(m.label, m.en)}</span>
                </Link>
                <button type="button" aria-label={fav ? t("ফেভারিট থেকে সরান", "Unfavorite") : t("ফেভারিট করুন", "Favorite")} aria-pressed={fav} onClick={() => toggle(m.label)}
                  className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full hover:bg-muted">
                  <Star className={"size-4 " + (fav ? "fill-gold text-gold" : "text-muted-foreground")} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
