import { useState } from "react";
import { Pencil, LoaderCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, SimpleSelect } from "@/components/kit";
import { correctLedgerEntry, editSavedEntry } from "@/lib/finance.functions";
import { useRows, type TableName } from "@/lib/db";
import { entryFields, editOptionLabels, changedEntryValues } from "@/lib/edit-fields";

export function EditEntry({ table, row }: { table: TableName; row: { id: string } }) {
 const record = row as unknown as Record<string,unknown>;
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[values,setValues]=useState<Record<string,string>>({});
 const qc=useQueryClient();
 const {data:heads=[]}=useRows("account_heads"),{data:designations=[]}=useRows("designations");
 const fields=entryFields(table).filter(f=>table!=="ledger_transactions"||f.key!=="units"||Number(record['units'])>0);
 function start(){setValues(Object.fromEntries(fields.map(f=>[f.key,f.type==="json"?JSON.stringify(record[f.key] ?? []):String(record[f.key] ?? "")])));setOpen(true);}
 async function save(){setBusy(true);try{
  const changed=changedEntryValues(record,values,fields);
  if(!Object.keys(changed).length){setOpen(false);return;}
  if(table==="ledger_transactions") await correctLedgerEntry({data:{id:row.id,values:changed,expected:record}});
  else await editSavedEntry({data:{table,id:row.id,values:changed,expected:record}});
  await qc.invalidateQueries({queryKey:["t"]});toast.success("তথ্য সংশোধন হয়েছে");setOpen(false);
 }catch(error){toast.error(error instanceof Error?error.message:(error as {message?:string})?.message ?? "সংশোধন হয়নি");}finally{setBusy(false);}}
 return <><Button type="button" variant="ghost" size="icon" aria-label="সম্পাদনা" title="এন্ট্রি সম্পাদনা" onClick={start}><Pencil className="size-4"/></Button>
 <Dialog open={open} onOpenChange={v=>{if(!busy)setOpen(v);}}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>এন্ট্রি সংশোধন</DialogTitle></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();void save();}}>
 {fields.map(field=>{
  const opts=field.key==="head_id"?heads.map(h=>({value:h.id,label:h.name})):field.key==="designation_id"?designations.map(d=>({value:d.id,label:d.name})):field.options?.map(value=>({value,label:editOptionLabels[value] ?? value}));
  return <Field key={field.key} label={field.label} className={field.type==="textarea"||field.type==="json"?"sm:col-span-2":""}>
  {opts?<SimpleSelect value={values[field.key] ?? ""} onChange={v=>setValues({...values,[field.key]:v})} options={opts}/>:field.type==="textarea"||field.type==="json"?<Textarea aria-label={field.label} rows={4} value={values[field.key] ?? ""} onChange={e=>setValues({...values,[field.key]:e.target.value})}/>:<Input aria-label={field.label} type={field.type ?? "text"} step={field.type==="number"?"any":undefined} required={field.type==="number"||field.type==="date"} value={values[field.key] ?? ""} onChange={e=>setValues({...values,[field.key]:e.target.value})}/>}
  </Field>;
 })}<div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>{busy&&<LoaderCircle className="size-4 animate-spin"/>}সংশোধন সংরক্ষণ</Button><Button type="button" variant="outline" disabled={busy} onClick={()=>setOpen(false)}>বাতিল</Button></div>
 </form></DialogContent></Dialog></>;
}