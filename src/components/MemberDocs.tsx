import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, FileText, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUpdate } from "@/lib/db";
import { getMemberDocUploadUrl, getMemberDocViewUrl } from "@/lib/r2.functions";

type Kind = "photo" | "id_doc";

function DocSlot({ memberId, kind, path, label, icon }: { memberId: string; kind: Kind; path: string | null; label: string; icon: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const upd = useUpdate("members");
  const getUploadUrl = useServerFn(getMemberDocUploadUrl);
  const getViewUrl = useServerFn(getMemberDocViewUrl);

  async function upload(file: File) {
    if (file.size > 10 * 1024 * 1024) return toast.error("ফাইল সর্বোচ্চ ১০ মেগাবাইট হতে পারে");
    setBusy(true);
    try {
      const { url, key } = await getUploadUrl({ data: { memberId, kind, fileName: file.name } });
      const res = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!res.ok) throw new Error(`আপলোড ব্যর্থ (${res.status})`);
      upd.mutate({ id: memberId, values: kind === "photo" ? { photo_path: key } : { id_doc_path: key } });
      toast.success(`${label} সংরক্ষণ হয়েছে`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setBusy(false);
    }
  }

  async function view() {
    if (!path) return;
    try {
      const { url } = await getViewUrl({ data: { key: path } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ফাইল খোলা যায়নি");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{path ? "আপলোড করা আছে" : "jpg, png, pdf — যেকোনো ফরম্যাট"}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {path && <Button type="button" size="sm" variant="outline" onClick={view}>দেখুন</Button>}
        <Button type="button" size="sm" variant={path ? "ghost" : "default"} disabled={busy} asChild>
          <label className="cursor-pointer">
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {path ? "বদলান" : "আপলোড"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          </label>
        </Button>
      </div>
    </div>
  );
}

export function MemberDocs({ memberId, photoPath, idDocPath }: { memberId: string; photoPath: string | null; idDocPath: string | null }) {
  return (
    <Card className="space-y-3 p-5 shadow-card">
      <h2 className="text-lg font-semibold">ছবি ও পরিচয়পত্র</h2>
      <DocSlot memberId={memberId} kind="photo" path={photoPath} label="সদস্যের ছবি" icon={<Camera className="size-5 text-muted-foreground" />} />
      <DocSlot memberId={memberId} kind="id_doc" path={idDocPath} label="আইডি কার্ড / NID" icon={<FileText className="size-5 text-muted-foreground" />} />
    </Card>
  );
}
