import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import readXlsxFile from "read-excel-file/browser";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, PageHeader } from "@/components/kit";
import { useRows } from "@/lib/db";
import { importMembers } from "@/lib/finance.functions";
import { csvDownload, parseMemberRows, type MemberImport } from "@/lib/import";
import { bn } from "@/lib/format";
import { pageHead } from "@/lib/metadata";
export const Route=createFileRoute("/_authenticated/import")({head:()=>pageHead("এক্সেল সদস্য আমদানি"),component:Import});
function Import(){
  useLang();
const {data:existing=[]}=useRows("members"),{data:batches=[]}=useRows("bulk_batches");const qc=useQueryClient();const [rows,setRows]=useState<MemberImport[]>([]),[errors,setErrors]=useState<string[]>([]),[busy,setBusy]=useState(false),[batch,setBatch]=useState("");
 async function file(file:File|undefined){if(!file)return;setBusy(true);try{const sheets=await readXlsxFile(file);const first=sheets[0];const parsed=parseMemberRows(first?.data??[],existing.map(m=>m.member_no));setRows(parsed.members);setErrors(parsed.errors);setBatch(crypto.randomUUID());}catch{toast.error(uiText("সঠিক .xlsx ফাইল নির্বাচন করুন"));}finally{setBusy(false);}}
 async function save(){setBusy(true);try{const r=await importMembers({data:{batch,rows}});toast.success(`${bn(r.count)} জন সদস্য আমদানি হয়েছে`);setRows([]);qc.invalidateQueries({queryKey:["t","members"]});qc.invalidateQueries({queryKey:["t","bulk_batches"]});}catch(e){toast.error(e instanceof Error?e.message:uiText("আমদানি হয়নি"));}finally{setBusy(false);}}
 return <div className="space-y-6"><PageHeader title={uiText("এক্সেল সদস্য আমদানি")} actions={<Button variant="outline" onClick={()=>csvDownload("member-template.csv",[["member_no","name","phone","address","nid"]])}><Download className="size-4"/>{uiText("নমুনা কলাম")}</Button>}/><section className="space-y-4 border-y border-border py-5"><label className="block font-medium" htmlFor="import-file">{uiText("সদস্য ফাইল (.xlsx)")}</label><Input id="import-file" type="file" accept=".xlsx" disabled={busy} onChange={e=>file(e.target.files?.[0])}/><DataTable head={[uiText("১ম কলাম"),uiText("২য় কলাম"),uiText("৩য় কলাম"),uiText("৪র্থ কলাম"),uiText("৫ম কলাম")]} rows={[[uiText("সদস্য নম্বর"),uiText("নাম"),uiText("মোবাইল"),uiText("ঠিকানা"),"NID"]]}/></section>{errors.length>0&&<div role="alert" className="space-y-1 text-destructive">{errors.map(e=><p key={e}>{e}</p>)}</div>}<DataTable head={[uiText("সদস্য নং"),uiText("নাম"),uiText("মোবাইল"),uiText("ঠিকানা"),"NID"]} rows={rows.map(m=>[m.member_no,m.name,m.phone,m.address,m.nid])}/><Button disabled={busy||rows.length===0||errors.length>0} onClick={save}><Upload className="size-4"/>{bn(rows.length)}  {uiText("জন সদস্য সংরক্ষণ")}</Button><h2 className="text-lg font-semibold">{uiText("আমদানির ইতিহাস")}</h2><DataTable head={[uiText("তারিখ"),uiText("সদস্য সংখ্যা"),uiText("ব্যাচ")]} rows={batches.filter(b=>b.kind==="members").map(b=>[b.created_at.slice(0,10),bn(b.row_count),b.id.slice(0,8)])}/></div>;
}
