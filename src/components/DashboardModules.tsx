import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { iconTone, menuSections } from "@/components/menu";
import { bn } from "@/lib/format";

const FAV_KEY = "somiti-favorites";
const all = menuSections.flatMap((s) => s.items.map((m) => ({ ...m, section: s.label })));

export function DashboardModules() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    try { setFavs(JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]")); } catch { setFavs([]); }
  }, []);
  function toggle(label: string) {
    const next = favs.includes(label) ? favs.filter((f) => f !== label) : [...favs, label];
    setFavs(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  }

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((m) =>
      (tab === "all" || (tab === "fav" ? favs.includes(m.label) : m.section === tab)) &&
      (!term || m.label.toLowerCase().includes(term) || m.section.toLowerCase().includes(term)));
  }, [q, tab, favs]);

  const tabs = [
    { key: "all", label: `সকল (${bn(all.length)})` },
    { key: "fav", label: `★ ফেভারিট (${bn(favs.length)})` },
    ...menuSections.map((s) => ({ key: s.label, label: `${s.label} (${bn(s.items.length)})` })),
  ];

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">সকল মডিউল ও দ্রুত কার্যক্রম</h2>
          <p className="text-sm text-muted-foreground">যেকোনো ফিচার খুঁজুন, তারকা চিহ্ন দিয়ে ফেভারিট করুন</p>
        </div>
        <label className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="ফিচার খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ফিচার খুঁজুন... (যেমন: লোন, সঞ্চয়, রিপোর্ট)" className="rounded-full pl-9" />
        </label>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={"shrink-0 rounded-full px-3 py-1.5 text-sm " + (tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary")}>
            {t.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{tab === "fav" ? "এখনো কোনো ফেভারিট নেই — কার্ডের তারকায় চাপ দিন" : "কিছু পাওয়া যায়নি"}</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {items.map((m, index) => {
            const fav = favs.includes(m.label);
            return (
              <div key={m.section + m.label} className="relative">
                <Link to={m.to} className="flex h-full min-h-28 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center transition-transform hover:-translate-y-0.5 hover:shadow-card">
                  <m.icon className={"size-9 " + iconTone(index)} />
                  <span className="text-sm leading-snug">{m.label}</span>
                </Link>
                <button type="button" aria-label={fav ? "ফেভারিট থেকে সরান" : "ফেভারিট করুন"} aria-pressed={fav} onClick={() => toggle(m.label)}
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
