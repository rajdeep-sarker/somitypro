import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { compareWithFirebase, syncAllToFirebase } from "@/lib/firebase.functions";

type Cmp = Awaited<ReturnType<typeof compareWithFirebase>>;

export function FirebaseCheck() {
  const sync = useServerFn(syncAllToFirebase);
  const compare = useServerFn(compareWithFirebase);
  const [rows, setRows] = useState<Cmp>([]);
  const [busy, setBusy] = useState(false);
  async function run(copy: boolean) {
    setBusy(true);
    try {
      if (copy) { const r = await sync(); toast.success(`${r.total}টি রেকর্ড Firebase-এ কপি হয়েছে`); }
      setRows(await compare());
    } catch (e) { toast.error(e instanceof Error ? e.message : "ব্যর্থ"); } finally { setBusy(false); }
  }
  const same = (r: Cmp[number]) => r.dbCount === r.fbCount && JSON.stringify(r.dbMoney) === JSON.stringify(r.fbMoney);
  return <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="mb-4 text-lg font-semibold">Firebase স্থানান্তর ও যাচাই</h2>
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy} onClick={() => run(true)}>সব তথ্য Firebase-এ কপি করুন</Button>
      <Button disabled={busy} variant="outline" onClick={() => run(false)}>দুই জায়গা মিলিয়ে দেখুন</Button>
    </div>
    {rows.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="text-left"><th className="p-2">বিভাগ</th><th className="p-2">এখানে</th><th className="p-2">Firebase</th><th className="p-2">টাকার মোট (এখানে / Firebase)</th><th className="p-2">ফলাফল</th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.table} className={same(r) ? "border-t" : "border-t bg-destructive/10 text-destructive"}>
        <td className="p-2">{r.table}</td><td className="p-2">{r.dbCount}</td><td className="p-2">{r.fbCount}</td>
        <td className="p-2">{Object.keys(r.dbMoney).map(k => `${k}: ${r.dbMoney[k]} / ${r.fbMoney[k] ?? 0}`).join(", ") || "—"}</td>
        <td className="p-2">{same(r) ? "মিলেছে" : "মেলেনি"}</td></tr>)}</tbody>
    </table></div>}
  </section>;
}
