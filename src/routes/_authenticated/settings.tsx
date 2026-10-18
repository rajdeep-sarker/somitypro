import { pageHead } from "@/lib/metadata";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormCard, PageHeader } from "@/components/kit";
import { useRows, useUpdate } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("সেটিং"),
  component: Settings,
});

function Settings() {
  const { data = [] } = useRows("somiti_settings", { order: "id" });
  const upd = useUpdate("somiti_settings");
  const [f, setF] = useState({ name: "", reg_no: "", address: "", phone: "", email: "" });
  const [pw, setPw] = useState({ current: "", next: "" });

  useEffect(() => {
    const s = data[0];
    if (s) setF({ name: s.name, reg_no: s.reg_no ?? "", address: s.address ?? "", phone: s.phone ?? "", email: s.email ?? "" });
  }, [data]);

  async function changePw() {
    const { error } = await supabase.auth.updateUser({ password: pw.next, current_password: pw.current } as never);
    if (error) toast.error(error.message);
    else { toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে"); setPw({ current: "", next: "" }); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="সমিতি ও ব্র্যান্ডিং সেটিংস" />
      <FormCard title="সমিতির তথ্য" onSubmit={() => upd.mutate({ id: 1, values: f })}>
        <Field label="সমিতির নাম" className="sm:col-span-2"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="রেজিস্ট্রেশন নং"><Input value={f.reg_no} onChange={(e) => setF({ ...f, reg_no: e.target.value })} /></Field>
        <Field label="মোবাইল"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="ইমেইল"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="ঠিকানা"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Button type="submit">সংরক্ষণ করুন</Button></div>
      </FormCard>
      <FormCard title="পাসওয়ার্ড পরিবর্তন" onSubmit={changePw}>
        <Field label="বর্তমান পাসওয়ার্ড"><Input type="password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
        <Field label="নতুন পাসওয়ার্ড"><Input type="password" minLength={6} required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Button type="submit">পরিবর্তন করুন</Button></div>
      </FormCard>
    </div>
  );
}
