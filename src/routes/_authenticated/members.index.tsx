import { pageHead } from "@/lib/metadata";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable, Field, PageHeader, SimpleSelect } from "@/components/kit";
import { nextNo, useInsert, useRows } from "@/lib/db";
import { bnDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/members/")({
  head: () => pageHead("সদস্যের তালিকা"),
  component: Members,
});

const empty = { name: "", father_name: "", mother_name: "", spouse_name: "", phone: "", nid: "", dob: "", gender: "", occupation: "", address: "", center_id: "", nominee_name: "", nominee_relation: "", nominee_phone: "", admission_date: "" };

function Members() {
  const { data: members = [] } = useRows("members", { order: "member_no", ascending: true });
  const { data: centers = [] } = useRows("centers");
  const ins = useInsert("members", "সদস্য তৈরি হয়েছে");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [f, setF] = useState(empty);
  const centerName = new Map(centers.map((c) => [c.id, c.name]));

  const list = useMemo(() => members.filter((m) => !q || [m.name, m.phone, m.member_no, m.nid].some((v) => v?.includes(q))), [members, q]);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  function save() {
    const member_no = nextNo("M-", members.map((m) => m.member_no));
    ins.mutate(
      { ...f, member_no, center_id: f.center_id || null, dob: f.dob || null, admission_date: f.admission_date || todayISO() },
      { onSuccess: () => { setOpen(false); setF(empty); } },
    );
  }

  return (
    <div>
      <PageHeader title="সদস্য ব্যবস্থাপনা" subtitle={`মোট ${members.length} জন সদস্য`} actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> সদস্য তৈরি করুন</Button>} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="নাম, মোবাইল বা সদস্য নং দিয়ে খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <DataTable
        head={["সদস্য নং", "নাম", "মোবাইল", "কেন্দ্র", "ভর্তির তারিখ", "অবস্থা", ""]}
        rows={list.map((m) => [
          m.member_no, <span key="n" className="font-medium">{m.name}</span>, m.phone, centerName.get(m.center_id ?? "") ?? "—", bnDate(m.admission_date),
          <Badge key="s" variant={m.status === "active" ? "default" : "secondary"}>{m.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>,
          <Button key="v" asChild size="sm" variant="outline"><Link to="/members/$id" params={{ id: m.id }}>বিস্তারিত</Link></Button>,
        ])}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>নতুন সদস্য তৈরি</DialogTitle></DialogHeader>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <Field label="সদস্যের নাম *"><Input required value={f.name} onChange={set("name")} /></Field>
            <Field label="মোবাইল নম্বর"><Input value={f.phone} onChange={set("phone")} /></Field>
            <Field label="পিতার নাম"><Input value={f.father_name} onChange={set("father_name")} /></Field>
            <Field label="মাতার নাম"><Input value={f.mother_name} onChange={set("mother_name")} /></Field>
            <Field label="স্বামী/স্ত্রীর নাম"><Input value={f.spouse_name} onChange={set("spouse_name")} /></Field>
            <Field label="জাতীয় পরিচয়পত্র নং"><Input value={f.nid} onChange={set("nid")} /></Field>
            <Field label="জন্ম তারিখ"><Input type="date" value={f.dob} onChange={set("dob")} /></Field>
            <Field label="লিঙ্গ"><SimpleSelect value={f.gender} onChange={(v) => setF({ ...f, gender: v })} options={[{ value: "পুরুষ", label: "পুরুষ" }, { value: "মহিলা", label: "মহিলা" }]} /></Field>
            <Field label="পেশা"><Input value={f.occupation} onChange={set("occupation")} /></Field>
            <Field label="কেন্দ্র"><SimpleSelect value={f.center_id} onChange={(v) => setF({ ...f, center_id: v })} options={centers.map((c) => ({ value: c.id, label: c.name }))} /></Field>
            <Field label="ঠিকানা" className="sm:col-span-2"><Input value={f.address} onChange={set("address")} /></Field>
            <Field label="নমিনির নাম"><Input value={f.nominee_name} onChange={set("nominee_name")} /></Field>
            <Field label="নমিনির সম্পর্ক"><Input value={f.nominee_relation} onChange={set("nominee_relation")} /></Field>
            <Field label="নমিনির মোবাইল"><Input value={f.nominee_phone} onChange={set("nominee_phone")} /></Field>
            <Field label="ভর্তির তারিখ"><Input type="date" value={f.admission_date} onChange={set("admission_date")} /></Field>
            <div className="sm:col-span-2"><Button type="submit" className="w-full" disabled={ins.isPending}>সংরক্ষণ করুন</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
