import { useCenterRows } from "@/components/CenterScope";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Field, PageHeader } from "@/components/kit";
import { useRows } from "@/lib/db";
import { bnDate, taka, todayISO } from "@/lib/format";
import { pageHead } from "@/lib/metadata";
export const Route=createFileRoute("/_authenticated/receipts")({head:()=>pageHead("লেনদেন রসিদ"),component:Receipts});
function Receipts(){const {data:s=[]}=useCenterRows("savings_transactions"),{data:r=[]}=useCenterRows("loan_repayments"),{data:d=[]}=useCenterRows("dps_transactions"),{data:f=[]}=useCenterRows("fdr_transactions"),{data:fa=[]}=useCenterRows("fdr_accounts"),{data:fees=[]}=useCenterRows("member_fees"),{data:members=[]}=useCenterRows("members"),{data:settings=[]}=useCenterRows("somiti_settings",{order:"id"});const [date,setDate]=useState(todayISO()),[chosen,setChosen]=useState("");
 const labels:Record<string,string>={deposit:"জমা",withdraw:"উত্তোলন",profit:"মুনাফা",profit_withdraw:"মুনাফা উত্তোলন",service_charge:"সার্ভিস চার্জ"};
 const records=[...s.map(t=>({...t,kind:`সঞ্চয় ${labels[t.type]}`})),...r.map(t=>({...t,amount:Number(t.amount)+Number(t.late_fee),kind:"ঋণের কিস্তি ও বিলম্ব চার্জ"})),...d.map(t=>({...t,kind:`DPS ${labels[t.type]}`})),...f.map(t=>({...t,kind:`FDR ${labels[t.type]}`})),...fa.map(t=>({id:t.id,member_id:t.member_id,amount:t.amount,txn_date:t.start_date,note:"",kind:"FDR আমানত"})),...fees.map(t=>({...t,kind:"সমিতি ফি"}))];const receipt=records.find(r=>r.id===chosen);const member=members.find(m=>m.id===receipt?.member_id);
 return <div className="space-y-6"><div className="no-print"><PageHeader title="লেনদেন রসিদ"/><Field label="তারিখ"><Input className="mb-5 max-w-xs" type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><DataTable head={["সদস্য","খাত","টাকা",""]} rows={records.filter(r=>r.txn_date===date).map(r=>[members.find(m=>m.id===r.member_id)?.name,r.kind,taka(r.amount),<Button variant="outline" size="icon" aria-label="রসিদ খুলুন" onClick={()=>setChosen(r.id)}><Printer className="size-4"/></Button>])}/></div>{receipt&&<section className="border-y border-border py-8"><Button className="no-print mb-6" onClick={()=>window.print()}><Printer className="size-4"/>রসিদ প্রিন্ট</Button><h2 className="text-center font-display text-2xl">{settings[0]?.name}</h2><p className="text-center">{settings[0]?.address}</p><h3 className="my-5 text-center text-xl">লেনদেন রসিদ</h3><p>রসিদ নম্বর: {receipt.id}</p><p>তারিখ: {bnDate(receipt.txn_date)}</p><p>সদস্য: {member?.member_no} — {member?.name}</p><p>খাত: {receipt.kind}</p><p className="my-4 text-xl font-semibold">টাকা: {taka(receipt.amount)}</p><p>{receipt.note}</p><div className="mt-16 flex justify-between"><span>প্রদানকারীর স্বাক্ষর</span><span>আদায়কারীর স্বাক্ষর</span></div></section>}</div>;
}
