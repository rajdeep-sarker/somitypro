import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, FileText, LoaderCircle, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, SimpleSelect } from "@/components/kit";
import { useRows, type Row } from "@/lib/db";
import { insertRow, updateRow } from "@/lib/data.functions";
import { todayISO } from "@/lib/format";
import { getMemberDocUploadUrl } from "@/lib/r2.functions";
import { validateMemberFile, type MemberFiles } from "@/lib/member-files";
import { useCenterScope } from "@/components/CenterScope";

const empty = { name: "", father_name: "", mother_name: "", spouse_name: "", phone: "", nid: "", dob: "", gender: "", occupation: "", address: "", center_id: "", nominee_name: "", nominee_relation: "", nominee_phone: "", admission_date: "", status: "active" };
const labels: Partial<Record<keyof typeof empty, string>> = { name: "সদস্যের নাম", phone: "মোবাইল নম্বর", father_name: "পিতার নাম", mother_name: "মাতার নাম", spouse_name: "স্বামী/স্ত্রীর নাম", nid: "জাতীয় পরিচয়পত্র নং", dob: "জন্ম তারিখ", occupation: "পেশা", address: "ঠিকানা", nominee_name: "নমিনির নাম", nominee_relation: "নমিনির সম্পর্ক", nominee_phone: "নমিনির মোবাইল", admission_date: "ভর্তির তারিখ" };

export function MemberForm({ member }: { member?: Row<"members"> }) {
  useLang();

  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [files, setFiles] = useState<MemberFiles>({ photo: null, id_doc: null });
  const [busy, setBusy] = useState(false);
  const { center } = useCenterScope();
  const { data: centers = [] } = useRows("centers");
  const qc = useQueryClient();
  const uploadUrl = useServerFn(getMemberDocUploadUrl);

  function start() {
    const values = { ...empty, center_id: center === "all" ? "" : center };
    if (member) for (const key of Object.keys(empty) as (keyof typeof empty)[]) values[key] = member[key] ?? empty[key];
    setF(values); setFiles({ photo: null, id_doc: null }); setOpen(true);
  }
  async function save() {
    setBusy(true);
    try {
      const id = member?.id ?? crypto.randomUUID();
      const paths = { photo_path: member?.photo_path ?? null, id_doc_path: member?.id_doc_path ?? null };
      for (const kind of ["photo", "id_doc"] as const) {
        const file = files[kind];
        if (!file) continue;
        validateMemberFile(file);
        const { url, key } = await uploadUrl({ data: { memberId: id, kind, fileName: file.name } });
        const response = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
        if (!response.ok) throw new Error(uiText("ফাইল আপলোড হয়নি। আবার চেষ্টা করুন"));
        paths[kind === "photo" ? "photo_path" : "id_doc_path"] = key;
      }
      const values = { ...f, ...paths, center_id: f.center_id || null, dob: f.dob || null, admission_date: f.admission_date || todayISO() };
      if (member) await updateRow({ data: { table: "members", id, values } });
      else await insertRow({ data: { table: "members", values: { ...values, id, member_no: "" } } });
      await qc.invalidateQueries({ queryKey: ["t", "members"] });
      toast.success(member ? uiText("সদস্যের তথ্য সংশোধন হয়েছে") : uiText("সদস্য তৈরি হয়েছে")); setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : (error as { message?: string })?.message ?? uiText("সংরক্ষণ হয়নি")); }
    finally { setBusy(false); }
  }
  return <>
    <Button onClick={start} variant={member ? "ghost" : "default"} size={member ? "icon" : "default"} aria-label={member ? uiText("সম্পাদনা") : undefined} title={member ? uiText("সদস্যের তথ্য সম্পাদনা") : undefined}>
      {member ? <Pencil className="size-4" /> : <><Plus className="size-4" />  {uiText("সদস্য তৈরি করুন")}</>}
    </Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{member ? uiText("সদস্যের তথ্য সংশোধন") : uiText("নতুন সদস্য তৈরি")}</DialogTitle></DialogHeader>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void save(); }}>
          {Object.entries(labels).map(([key, label]) => {
            const k = key as keyof typeof empty;
            return <Field key={key} label={label ?? key} className={k === "address" ? "sm:col-span-2" : ""}><Input aria-label={label} required={k === "name"} type={k === "dob" || k === "admission_date" ? "date" : "text"} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></Field>;
          })}
          <Field label={uiText("লিঙ্গ")}><SimpleSelect value={f.gender} onChange={v => setF({ ...f, gender: v })} options={[{ value: "পুরুষ", label: "পুরুষ" }, { value: "মহিলা", label: "মহিলা" }]} /></Field>
          <Field label={uiText("কেন্দ্র")}><SimpleSelect value={f.center_id} onChange={v => setF({ ...f, center_id: v })} options={centers.map(c => ({ value: c.id, label: c.name }))} /></Field>
          {member && <Field label={uiText("অবস্থা")}><SimpleSelect value={f.status} onChange={v => setF({ ...f, status: v })} options={[{ value: "active", label: "সক্রিয়" }, { value: "inactive", label: "নিষ্ক্রিয়" }]} /></Field>}
          {(["photo", "id_doc"] as const).map(kind => <Field key={kind} label={kind === "photo" ? uiText("সদস্যের ছবি") : uiText("আইডি কার্ড / NID")}>
            <div className="flex items-center gap-2">{kind === "photo" ? <Camera className="size-5 shrink-0 text-muted-foreground" /> : <FileText className="size-5 shrink-0 text-muted-foreground" />}<Input aria-label={kind === "photo" ? uiText("সদস্যের ছবি") : uiText("আইডি কার্ড / NID")} type="file" accept="image/*,.pdf" disabled={busy} onChange={e => {
              const file = e.target.files?.[0] ?? null;
              try { if (file) validateMemberFile(file); setFiles({ ...files, [kind]: file }); }
              catch (error) { e.target.value = ""; toast.error(error instanceof Error ? error.message : uiText("ফাইল সঠিক নয়")); }
            }} /></div>
            {member?.[kind === "photo" ? "photo_path" : "id_doc_path"] && !files[kind] && <p className="text-xs text-muted-foreground">{uiText("আগের ফাইল সংরক্ষিত আছে")}</p>}
          </Field>)}
          <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin" />}{uiText("সংরক্ষণ করুন")}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>{uiText("বাতিল")}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}