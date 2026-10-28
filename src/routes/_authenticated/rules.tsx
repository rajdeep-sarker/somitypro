import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormCard, PageHeader } from "@/components/kit";
import { useDelete, useInsert, useRows, useUpdate } from "@/lib/db";
import { pageHead } from "@/lib/metadata";
export const Route=createFileRoute("/_authenticated/rules")({head:()=>pageHead("নিয়ম ও নীতিমালা"),component:Rules});
function Rules(){
  useLang();
const {data:rules=[]}=useRows("somiti_rules"),{data:roles=[]}=useRows("user_roles");const add=useInsert("somiti_rules"),upd=useUpdate("somiti_rules"),del=useDelete("somiti_rules");const [f,setF]=useState({title:"",content:""}),[id,setId]=useState("");const admin=roles.some(r=>r.role==="admin");return <div className="space-y-6"><PageHeader title={uiText("নিয়ম ও নীতিমালা")} actions={<Button variant="outline" onClick={()=>window.print()}><Printer className="size-4"/>{uiText("প্রিন্ট")}</Button>}/>{admin&&<div className="no-print"><FormCard title={id?uiText("নীতিমালা সংশোধন"):uiText("নীতিমালা যোগ করুন")} onSubmit={()=>{const reset=()=>{setF({title:"",content:""});setId("");};if(id)upd.mutate({id,values:f},{onSuccess:reset});else add.mutate(f,{onSuccess:reset});}}><Field label={uiText("শিরোনাম")}><Input required value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></Field><Field label={uiText("বিবরণ")} className="sm:col-span-2"><Textarea required rows={6} value={f.content} onChange={e=>setF({...f,content:e.target.value})}/></Field><Button type="submit" disabled={add.isPending||upd.isPending}>{uiText("সংরক্ষণ করুন")}</Button>{id&&<Button variant="outline" onClick={()=>{setId("");setF({title:"",content:""});}}>{uiText("বাতিল")}</Button>}</FormCard></div>}{!rules.length&&<p className="py-8 text-muted-foreground">{uiText("কোনো নীতিমালা যোগ করা হয়নি")}</p>}{rules.map(r=><section key={r.id} className="border-b border-border py-5"><h2 className="text-xl font-semibold">{r.title}</h2><p className="mt-3 whitespace-pre-wrap">{r.content}</p>{admin&&<div className="no-print mt-4 flex gap-2"><Button variant="outline" size="sm" title={uiText("সম্পাদনা")} onClick={()=>{setId(r.id);setF({title:r.title,content:r.content});window.scrollTo({top:0,behavior:"smooth"});}}><Pencil className="size-4"/></Button><Button variant="destructive" size="sm" disabled={del.isPending} onClick={()=>{if(window.confirm(uiText("এই নীতিমালা মুছে ফেলবেন?")))del.mutate(r.id);}}>{uiText("মুছুন")}</Button></div>}</section>)}</div>;}
