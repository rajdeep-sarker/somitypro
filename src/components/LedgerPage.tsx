import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Field, FormCard, MemberSelect, PageHeader, SimpleSelect, StatCard, useMemberMap } from "@/components/kit";
import { useInsert, useRows, useUpdate } from "@/lib/db";
import { supabase } from "@/lib/app-client";
import { bn, bnDate, sum, taka, todayISO } from "@/lib/format";

type Module = "shares" | "investments" | "fund" | "banks";
const labels: Record<string,string> = { purchase: "শেয়ার ক্রয়", withdraw: "উত্তোলন", dividend: "লভ্যাংশ প্রদান", invest: "বিনিয়োগ প্রদান", return: "মূলধন ফেরত", profit: "মুনাফা প্রাপ্তি", deposit: "জমা", expense: "খরচ", waiver: "ঋণ মওকুফ", transfer_in: "স্থানান্তর প্রাপ্তি", transfer_out: "স্থানান্তর প্রদান" };
const config = {
 shares: { title: "শেয়ার ব্যবস্থাপনা", account: "শেয়ার শ্রেণি", types: ["purchase","withdraw","dividend"] },
 investments: { title: "বিনিয়োগ ও প্রকল্প", account: "প্রকল্প", types: ["invest","return","profit","expense"] },
 fund: { title: "বীমা / নিরাপত্তা তহবিল", account: "তহবিল", types: ["deposit","expense","waiver"] },
 banks: { title: "ব্যাংক হিসাব", account: "ব্যাংক হিসাব", types: ["deposit","withdraw","profit","expense"] },
};
export function LedgerPage({ module }: { module: Module }) {
 const c = config[module];
 const { data: all = [], isPending, error } = useRows("ledger_accounts");
 const { data: tx = [] } = useRows("ledger_transactions");
 const { data: loans = [] } = useRows("loans");
 const { data: rep = [] } = useRows("loan_repayments");
 const { data: settings = [] } = useRows("somiti_settings",{order:"id"});
 const accounts = all.filter(a=>a.module===module);
 const mm = useMemberMap(); const qc = useQueryClient();
 const addAccount = useInsert("ledger_accounts"), addTxn = useInsert("ledger_transactions"), update = useUpdate("ledger_accounts");
 const [a,setA] = useState({ name:"", account_no:"", bank_name:"", branch:"", unit_price:"100", opening_balance:"0", budget:"0", start_date:todayISO(), note:"" });
 const [f,setF] = useState({ account_id:"", member_id:"", loan_id:"", type:c.types[0] ?? "deposit", amount:"", units:"1", txn_date:todayISO(), note:"", reference:"" });
 const [show,setShow] = useState(false), [filter,setFilter] = useState("all"), [member,setMember] = useState(""), [from,setFrom] = useState(""), [to,setTo] = useState("");
 const [transfer,setTransfer] = useState({from:"",to:"",amount:""}),[busy,setBusy]=useState(false);
 const [receipt,setReceipt] = useState<(typeof tx)[number] | null>(null);
 const active=accounts.filter(a=>a.status==="active");
 const selected=accounts.find(a=>a.id===f.account_id);
 const list=tx.filter(t=>accounts.some(a=>a.id===t.account_id) && (filter==="all"||t.account_id===filter) && (!member||t.member_id===member) && (!from||t.txn_date>=from) && (!to||t.txn_date<=to));
 const balance=(id:string)=>{ const acc=accounts.find(a=>a.id===id);return Number(acc?.opening_balance??0)+sum(tx.filter(t=>t.account_id===id),t=>["purchase","deposit","return","profit","transfer_in"].includes(t.type)?Number(t.amount):-Number(t.amount)); };
 const holdings=(account:string,member:string)=>sum(tx.filter(t=>t.account_id===account&&t.member_id===member),t=>t.type==="purchase"?Number(t.units):t.type==="withdraw"?-Number(t.units):0);
 function saveTransaction(){
  const share=module==="shares"&&f.type!=="dividend";
  addTxn.mutate({...f,member_id:f.member_id||null,loan_id:f.type==="waiver"?f.loan_id||null:null,amount:share?Number(f.units)*Number(selected?.unit_price??0):Number(f.amount),units:share?Number(f.units):0},{onSuccess:()=>{setF({...f,amount:"",note:"",reference:""});qc.invalidateQueries({queryKey:["t","loans"]});}});
 }
 async function doTransfer(){setBusy(true); const {error}=await supabase.rpc("transfer_bank",{p_from:transfer.from,p_to:transfer.to,p_amount:Number(transfer.amount),p_date:f.txn_date,p_note:f.note});setBusy(false);if(error)toast.error(error.message);else {toast.success("স্থানান্তর সম্পন্ন হয়েছে");setTransfer({...transfer,amount:""});qc.invalidateQueries({queryKey:["t","ledger_transactions"]});}}
 return <div className="min-w-0 space-y-6">
 <div className={receipt?"no-print space-y-6":"space-y-6"}>
 <PageHeader title={c.title} actions={<><Button variant="outline" onClick={()=>{setReceipt(null);window.print();}}><Printer className="size-4"/>প্রিন্ট</Button><Button onClick={()=>setShow(!show)}>{show?"বন্ধ করুন":`নতুন ${c.account}`}</Button></>}/>
 {error&&<p role="alert" className="text-destructive">তথ্য লোড হয়নি। আবার চেষ্টা করুন।</p>}
 <div className="grid gap-3 sm:grid-cols-3"><StatCard label={`মোট ${c.account}`} value={bn(accounts.length)}/><StatCard label={module==="investments"?"নিট নগদ প্রবাহ":"বর্তমান স্থিতি"} value={taka(sum(accounts,a=>balance(a.id)))}/><StatCard label="লেনদেন সংখ্যা" value={bn(list.length)}/></div>
 {show&&<FormCard title={`নতুন ${c.account}`} onSubmit={()=>addAccount.mutate({...a,module,unit_price:Number(a.unit_price),opening_balance:Number(a.opening_balance),budget:Number(a.budget)},{onSuccess:()=>{setA({...a,name:"",account_no:""});setShow(false);}})}>
 <Field label="নাম"><Input required value={a.name} onChange={e=>setA({...a,name:e.target.value})}/></Field>
 {module==="shares"?<Field label="প্রতি শেয়ারের মূল্য"><Input required min="0.01" step="0.01" type="number" value={a.unit_price} onChange={e=>setA({...a,unit_price:e.target.value})}/></Field>:<Field label="প্রারম্ভিক স্থিতি"><Input type="number" min="0" value={a.opening_balance} onChange={e=>setA({...a,opening_balance:e.target.value})}/></Field>}
 {module==="banks"&&<><Field label="হিসাব নম্বর"><Input required value={a.account_no} onChange={e=>setA({...a,account_no:e.target.value})}/></Field><Field label="ব্যাংকের নাম"><Input required value={a.bank_name} onChange={e=>setA({...a,bank_name:e.target.value})}/></Field><Field label="শাখা"><Input value={a.branch} onChange={e=>setA({...a,branch:e.target.value})}/></Field></>}
 {module==="investments"&&<><Field label="বাজেট"><Input type="number" min="0" value={a.budget} onChange={e=>setA({...a,budget:e.target.value})}/></Field><Field label="শুরুর তারিখ"><Input type="date" value={a.start_date} onChange={e=>setA({...a,start_date:e.target.value})}/></Field></>}
 <Field label="বিবরণ"><Input value={a.note} onChange={e=>setA({...a,note:e.target.value})}/></Field><Button type="submit" disabled={addAccount.isPending}>সংরক্ষণ করুন</Button></FormCard>}
 <DataTable head={[c.account,module==="shares"?"শেয়ার মূল্য":"হিসাব / বাজেট","স্থিতি","অবস্থা",""]} empty={isPending?"লোড হচ্ছে…":"কোনো হিসাব নেই"} rows={accounts.map(a=>[<div><p>{a.name}</p><small>{a.bank_name} {a.branch}</small></div>,module==="shares"?taka(a.unit_price):module==="investments"?taka(a.budget):a.account_no||"—",taka(balance(a.id)),a.status==="active"?"সক্রিয়":"বন্ধ",<Button variant="outline" size="sm" disabled={update.isPending} onClick={()=>update.mutate({id:a.id,values:{status:a.status==="active"?"closed":"active"}})}>{a.status==="active"?"বন্ধ করুন":"সক্রিয় করুন"}</Button>])}/>
 <FormCard title="লেনদেন এন্ট্রি" onSubmit={saveTransaction}>
 <Field label={c.account}><SimpleSelect value={f.account_id} onChange={v=>setF({...f,account_id:v})} options={active.map(a=>({value:a.id,label:a.name}))}/></Field>
 <Field label="লেনদেনের ধরন"><SimpleSelect value={f.type} onChange={v=>setF({...f,type:v})} options={c.types.map(value=>({value,label:labels[value]??value}))}/></Field>
 {(module==="shares"||module==="fund")&&<Field label="সদস্য"><MemberSelect value={f.member_id} onChange={v=>setF({...f,member_id:v,loan_id:""})}/></Field>}
 {f.type==="waiver"&&<Field label="ঋণ"><SimpleSelect value={f.loan_id} onChange={v=>setF({...f,loan_id:v})} options={loans.filter(l=>l.status==="active"&&l.member_id===f.member_id).map(l=>({value:l.id,label:`${l.loan_no} — বকেয়া ${taka(l.total_payable-sum(rep.filter(r=>r.loan_id===l.id),r=>r.amount))}`}))}/></Field>}
 {module==="shares"&&f.type!=="dividend"?<Field label={`শেয়ার সংখ্যা — ${taka(Number(f.units)*Number(selected?.unit_price??0))}`}><Input type="number" min="1" step="1" required value={f.units} onChange={e=>setF({...f,units:e.target.value})}/></Field>:<Field label="টাকা"><Input type="number" min="0.01" step="0.01" required value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/></Field>}
 <Field label="তারিখ"><Input required type="date" value={f.txn_date} onChange={e=>setF({...f,txn_date:e.target.value})}/></Field><Field label="রেফারেন্স"><Input value={f.reference} onChange={e=>setF({...f,reference:e.target.value})}/></Field><Field label="মন্তব্য"><Input value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></Field>
 <Button type="submit" disabled={addTxn.isPending||!f.account_id||(module==="shares"&&!f.member_id)||(f.type==="waiver"&&!f.loan_id)}>সংরক্ষণ করুন</Button></FormCard>
 {module==="banks"&&<FormCard title="ব্যাংক থেকে ব্যাংকে স্থানান্তর" onSubmit={doTransfer}><Field label="যে হিসাব থেকে"><SimpleSelect value={transfer.from} onChange={v=>setTransfer({...transfer,from:v})} options={active.map(a=>({value:a.id,label:a.name}))}/></Field><Field label="যে হিসাবে"><SimpleSelect value={transfer.to} onChange={v=>setTransfer({...transfer,to:v})} options={active.filter(a=>a.id!==transfer.from).map(a=>({value:a.id,label:a.name}))}/></Field><Field label="টাকা"><Input required min="0.01" step="0.01" type="number" value={transfer.amount} onChange={e=>setTransfer({...transfer,amount:e.target.value})}/></Field><Button type="submit" disabled={busy||!transfer.from||!transfer.to}>স্থানান্তর করুন</Button></FormCard>}
 {module==="shares"&&<><h2 className="text-lg font-semibold">শেয়ারধারী তালিকা</h2><DataTable head={["সদস্য",c.account,"শেয়ার সংখ্যা","শেয়ার মূল্য"]} rows={accounts.flatMap(a=>Array.from(mm.values()).filter(m=>holdings(a.id,m.id)>0).map(m=>[`${m.member_no} — ${m.name}`,a.name,bn(holdings(a.id,m.id)),taka(holdings(a.id,m.id)*a.unit_price)]))}/></>}
 {module==="fund"&&<DataTable head={["তহবিল আয়","খরচ ও মওকুফ","উদ্বৃত্ত"]} rows={[[taka(sum(tx.filter(t=>accounts.some(a=>a.id===t.account_id)&&t.type==="deposit"),t=>t.amount)),taka(sum(tx.filter(t=>accounts.some(a=>a.id===t.account_id)&&["expense","waiver"].includes(t.type)),t=>t.amount)),taka(sum(accounts,a=>balance(a.id)))]]}/>}
 <div className="no-print grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="হিসাব"><SimpleSelect value={filter} onChange={setFilter} options={[{value:"all",label:"সকল হিসাব"},...accounts.map(a=>({value:a.id,label:a.name}))]}/></Field><Field label="শুরু"><Input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></Field><Field label="শেষ"><Input type="date" value={to} onChange={e=>setTo(e.target.value)}/></Field><Field label="সদস্য"><SimpleSelect value={member||"all"} onChange={v=>setMember(v==="all"?"":v)} options={[{value:"all",label:"সকল সদস্য"},...Array.from(mm.values()).map(m=>({value:m.id,label:`${m.member_no} — ${m.name}`}))]}/></Field></div>
 <DataTable head={["তারিখ",c.account,"সদস্য","ধরন","টাকা","মন্তব্য",""]} rows={list.map(t=>[bnDate(t.txn_date),accounts.find(a=>a.id===t.account_id)?.name,mm.get(t.member_id??"")?.name||"—",labels[t.type],taka(t.amount),t.note,<Button size="icon" variant="ghost" aria-label="রসিদ" onClick={()=>setReceipt(t)}><Printer className="size-4"/></Button>])}/>
 </div>
 {receipt&&<section className="border-y border-border py-8"><div className="no-print mb-4 flex gap-2"><Button onClick={()=>window.print()}><Printer className="size-4"/>রসিদ প্রিন্ট</Button><Button variant="outline" onClick={()=>setReceipt(null)}>বন্ধ করুন</Button></div><h2 className="text-center font-display text-2xl">{settings[0]?.name}</h2><p className="text-center">{settings[0]?.address}</p><h3 className="my-4 text-center text-xl">লেনদেন রসিদ</h3><p>রসিদ নং: {receipt.id}</p><p>তারিখ: {bnDate(receipt.txn_date)}</p><p>সদস্য: {mm.get(receipt.member_id??"")?.name||"—"}</p><p>হিসাব: {accounts.find(a=>a.id===receipt.account_id)?.name}</p><p>ধরন: {labels[receipt.type]}</p><p className="my-4 text-xl font-semibold">টাকা: {taka(receipt.amount)}</p><p>{receipt.note}</p><div className="mt-16 flex justify-between"><span>প্রদানকারীর স্বাক্ষর</span><span>আদায়কারীর স্বাক্ষর</span></div></section>}
 </div>;
}
