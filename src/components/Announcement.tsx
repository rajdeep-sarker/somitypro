import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { takeAnnouncement } from "@/lib/announcements.functions";

const KEY = "somiti-announcement-checked";
const PENDING = "somiti-announcement-pending";

/** CTO banner popup; checked once per app visit and closable only with the × button. */
export function AnnouncementPopup() {
  const take = useServerFn(takeAnnouncement);
  const [a, setA] = useState<{ title: string; message: string } | null>(null);
  useEffect(() => {
    // The fetched banner is kept in sessionStorage until ×, so a remount cannot lose it.
    const pending = sessionStorage.getItem(PENDING);
    if (pending) { setA(JSON.parse(pending)); return; }
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, "1");
    void take().then((r) => { if (r) { sessionStorage.setItem(PENDING, JSON.stringify(r)); setA(r); } }).catch(() => {});
  }, [take]);
  if (!a) return null;
  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="top-6 max-w-xl translate-y-0 border-2 border-gold p-0 [&>button:last-child]:hidden"
        onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <div className="flex items-start gap-3 rounded-t-lg bg-gold/15 p-5">
          <Megaphone className="mt-1 size-6 shrink-0 text-gold" />
          <div className="flex-1">
            <DialogTitle className="text-lg">{a.title}</DialogTitle>
            <DialogDescription className="mt-2 whitespace-pre-wrap text-base text-foreground">{a.message}</DialogDescription>
          </div>
          <button type="button" aria-label="বন্ধ করুন" onClick={() => { sessionStorage.removeItem(PENDING); setA(null); }} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card shadow-card hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
