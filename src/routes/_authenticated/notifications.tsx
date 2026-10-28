import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { useCenterRows } from "@/components/CenterScope";
import { EditEntry } from "@/components/EditEntry";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, Field, FormCard, PageHeader, SimpleSelect } from "@/components/kit";
import { useInsert, useRows } from "@/lib/db";
import { csvDownload } from "@/lib/import";
import { bn, bnDate } from "@/lib/format";
import { pageHead } from "@/lib/metadata";
export const Route=createFileRoute("/_authenticated/notifications")({head:()=>pageHead("SMS ও ইমেইল বার্তা"),component:Notifications});
function Notifications(){
  useLang();
const {data:members=[]}=useCenterRows("members"),{data:drafts=[]}=useCenterRows("notification_drafts");const ins=useInsert("notification_drafts");const [channel,setChannel]=useState("sms"),[message,setMessage]=useState(""),[search,setSearch]=useState(""),[selected,setSelected]=useState<string[]>([]),[emails,setEmails]=useState("");const list=members.filter(m=>m.status==="active"&&`${m.name} ${m.member_no} ${m.phone}`.includes(search));const recipients=channel==="sms"?members.filter(m=>selected.includes(m.id)&&m.phone).map(m=>({name:m.name,address:m.phone??""})):emails.split(/[\n,;]/).map(e=>e.trim()).filter(e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).map(address=>({name:"",address}));
 return <div className="space-y-6"><PageHeader title={uiText("SMS ও ইমেইল বার্তা")}/><p role="status" className="border-l-4 border-warning bg-accent p-4 text-accent-foreground">{uiText("বার্তা পাঠানো চালু নেই — SMS / ইমেইল সেবার সংযোগ প্রয়োজন।")}</p><FormCard title={uiText("নতুন বার্তার খসড়া")} onSubmit={()=>ins.mutate({channel,message,recipients},{onSuccess:()=>setMessage("")})}><Field label={uiText("মাধ্যম")}><SimpleSelect value={channel} onChange={setChannel} options={[{value:"sms",label:"SMS"},{value:"email",label:"ইমেইল"}]}/></Field><Field label={uiText("প্রাপক সংখ্যা")}><p className="py-2">{bn(recipients.length)}</p></Field>{channel==="email"&&<Field label={uiText("প্রাপকের ইমেইল")} className="sm:col-span-2"><Textarea rows={3} value={emails} onChange={e=>setEmails(e.target.value)}/></Field>}<Field label={uiText("বার্তা")} className="sm:col-span-2"><Textarea required rows={5} value={message} onChange={e=>setMessage(e.target.value)}/></Field><Button type="submit" disabled={ins.isPending||!recipients.length}>{uiText("খসড়া সংরক্ষণ")}</Button><Button variant="outline" disabled={!recipients.length||!message} onClick={()=>csvDownload("message-recipients.csv",[[uiText("নাম"),uiText("প্রাপক"),uiText("বার্তা")],...recipients.map(r=>[r.name,r.address,message])])}><Download className="size-4"/>{uiText("প্রাপক ও বার্তা ডাউনলোড")}</Button></FormCard>{channel==="sms"&&<><Input aria-label={uiText("সদস্য খুঁজুন")} placeholder={uiText("নাম, নম্বর বা মোবাইল")} value={search} onChange={e=>setSearch(e.target.value)}/><Button variant="outline" onClick={()=>setSelected(list.filter(m=>m.phone).map(m=>m.id))}>{uiText("সকল প্রাপক নির্বাচন")}</Button><DataTable head={[uiText("নির্বাচন"),uiText("সদস্য নং"),uiText("নাম"),uiText("মোবাইল")]} rows={list.map(m=>[<Checkbox aria-label={`${m.name} নির্বাচন`} disabled={!m.phone} checked={selected.includes(m.id)} onCheckedChange={v=>setSelected(v===true?[...selected,m.id]:selected.filter(id=>id!==m.id))}/>,m.member_no,m.name,m.phone])}/></>}<h2 className="text-lg font-semibold">{uiText("সংরক্ষিত খসড়া")}</h2><DataTable head={[uiText("তারিখ"),uiText("মাধ্যম"),uiText("বার্তা"),uiText("অবস্থা"),""]} rows={drafts.map(d=>[bnDate(d.created_at),d.channel,<p className="max-w-md whitespace-pre-wrap">{d.message}</p>,uiText("পাঠানো হয়নি"),<EditEntry key="e" table="notification_drafts" row={d}/>])}/></div>;
}
