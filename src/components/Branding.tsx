import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Landmark, ImageIcon, PenLine, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBranding, getPublicLogo, saveBranding, type SignatureSlot } from "@/lib/branding.functions";
import { cleanSignature, shrinkLogo } from "@/lib/image-clean";

export const logoQuery = { queryKey: ["branding", "logo"], queryFn: () => getPublicLogo(), staleTime: 5 * 60_000 };

/** The somiti logo, or the default bank icon when none is uploaded. */
export function SomitiLogo({ className = "size-7" }: { className?: string }) {
  const { data: logo } = useQuery(logoQuery);
  return logo ? <img src={logo} alt="সমিতির লোগো" className={className + " object-contain"} /> : <Landmark className={className} />;
}

/** Signature boxes under printed pages. Empty slots print a line for signing by hand. */
export function SignatureRow() {
  const get = useServerFn(getBranding);
  const { data } = useQuery({ queryKey: ["branding", "all"], queryFn: () => get(), staleTime: 5 * 60_000 });
  const slots = data?.signatures ?? [];
  if (!slots.length) return null;
  return (
    <div className="mt-16 grid gap-8 break-inside-avoid" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
      {slots.map((s) => (
        <div key={s.id} className="flex flex-col items-center">
          <div className="flex h-16 w-full items-end justify-center">{s.image && <img src={s.image} alt={s.label} className="max-h-16 max-w-full object-contain" />}</div>
          <div className="w-full border-t-2 border-foreground/50 pt-1 text-center text-sm font-semibold">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Settings card: logo upload and signature slots (add, rename, upload, remove). */
export function BrandingSettings() {
  const qc = useQueryClient();
  const get = useServerFn(getBranding), save = useServerFn(saveBranding);
  const { data } = useQuery({ queryKey: ["branding", "all"], queryFn: () => get() });
  const [logo, setLogo] = useState("");
  const [slots, setSlots] = useState<SignatureSlot[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { setLogo(data.logo); setSlots(data.signatures); } }, [data]);

  async function persist(nextLogo: string, nextSlots: SignatureSlot[], ok: string) {
    setBusy(true);
    try { await save({ data: { logo: nextLogo, signatures: nextSlots } }); setLogo(nextLogo); setSlots(nextSlots); await qc.invalidateQueries({ queryKey: ["branding"] }); toast.success(ok); }
    catch (e) { toast.error(e instanceof Error ? e.message : "সংরক্ষণ হয়নি"); }
    finally { setBusy(false); }
  }
  async function pickLogo(f?: File) { if (!f) return; try { await persist(await shrinkLogo(f), slots, "লোগো সংরক্ষিত"); } catch (e) { toast.error(e instanceof Error ? e.message : "ছবি পড়া যায়নি"); } }
  async function pickSign(id: string, f?: File) {
    if (!f) return;
    try { const img = await cleanSignature(f); await persist(logo, slots.map((s) => (s.id === id ? { ...s, image: img } : s)), "স্বাক্ষর সংরক্ষিত — শুধু কালির অংশ রাখা হয়েছে"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "ছবি পড়া যায়নি"); }
  }

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-card">
      <h2 className="text-lg font-semibold">ব্র্যান্ডিং, লোগো ও স্বাক্ষর</h2>
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
          <p className="flex items-center gap-2 font-semibold"><ImageIcon className="size-4 text-primary" />সমিতির নিজস্ব লোগো</p>
          <div className="flex items-center gap-3">
            <div className="flex size-20 items-center justify-center rounded-xl border-2 border-dashed bg-card">{logo ? <img src={logo} alt="লোগো" className="max-h-16 max-w-16 object-contain" /> : <Landmark className="size-8 text-muted-foreground" />}</div>
            <p className="text-sm text-muted-foreground">{logo ? "লোগো আপলোড করা আছে" : "কোনো লোগো আপলোড করা হয়নি"}<br />JPG / PNG</p>
          </div>
          <Input type="file" accept="image/*" disabled={busy} onChange={(e) => void pickLogo(e.target.files?.[0])} />
          {logo && <Button size="sm" variant="outline" disabled={busy} onClick={() => void persist("", slots, "লোগো সরানো হয়েছে")}>লোগো সরান</Button>}
        </div>
        <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
          <p className="flex items-center gap-2 font-semibold"><PenLine className="size-4 text-primary" />প্রিন্টের নিচে স্বাক্ষর</p>
          <p className="text-sm text-muted-foreground">সাদা কাগজে স্বাক্ষর করে ছবি তুলে আপলোড করুন — কাগজের অংশ নিজে থেকেই মুছে শুধু স্বাক্ষর থাকবে। ছবি না দিলে প্রিন্টে শুধু লাইন থাকবে, হাতে স্বাক্ষর করা যাবে।</p>
          {slots.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
              <div className="flex h-14 w-36 items-center justify-center rounded border border-dashed bg-background">{s.image ? <img src={s.image} alt={s.label} className="max-h-12 max-w-32 object-contain" /> : <span className="text-xs text-muted-foreground">স্বাক্ষর নেই</span>}</div>
              <Input className="w-48" value={s.label} onChange={(e) => setSlots(slots.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))} onBlur={() => void persist(logo, slots, "নাম সংরক্ষিত")} aria-label="স্বাক্ষরের ঘরের নাম" />
              <Input type="file" accept="image/*" className="w-56" disabled={busy} onChange={(e) => void pickSign(s.id, e.target.files?.[0])} />
              {s.image && <Button size="sm" variant="outline" disabled={busy} onClick={() => void persist(logo, slots.map((x) => (x.id === s.id ? { ...x, image: "" } : x)), "স্বাক্ষর সরানো হয়েছে")}>ছবি সরান</Button>}
              <Button size="icon" variant="ghost" aria-label="ঘর মুছুন" disabled={busy || slots.length <= 1} onClick={() => void persist(logo, slots.filter((x) => x.id !== s.id), "ঘর মুছে ফেলা হয়েছে")}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))}
          {slots.length < 6 && <Button size="sm" variant="outline" className="gap-1" disabled={busy} onClick={() => void persist(logo, [...slots, { id: crypto.randomUUID().slice(0, 8), label: "নতুন স্বাক্ষর", image: "" }], "নতুন ঘর যোগ হয়েছে")}><Plus className="size-4" />আরেকটি স্বাক্ষর যোগ করুন</Button>}
        </div>
      </div>
    </section>
  );
}
