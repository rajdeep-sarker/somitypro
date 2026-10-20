import { MemberForm } from "@/components/MemberForm";
import { pageHead } from "@/lib/metadata";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable, Field, PageHeader, SimpleSelect } from "@/components/kit";
import { useRows } from "@/lib/db";
import { bnDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/members/")({
  head: () => pageHead("সদস্যের তালিকা"),
  component: Members,
});

const empty = { name: "", father_name: "", mother_name: "", spouse_name: "", phone: "", nid: "", dob: "", gender: "", occupation: "", address: "", center_id: "", nominee_name: "", nominee_relation: "", nominee_phone: "", admission_date: "" };

function Members() {
  const { data: members = [] } = useRows("members", { order: "member_no", ascending: true });
  const { data: centers = [] } = useRows("centers");

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [f, setF] = useState(empty);
  const centerName = new Map(centers.map((c) => [c.id, c.name]));

  const list = useMemo(() => members.filter((m) => !q || [m.name, m.phone, m.member_no, m.nid].some((v) => v?.includes(q))), [members, q]);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <PageHeader title="সদস্য ব্যবস্থাপনা" subtitle={`মোট ${members.length} জন সদস্য`} actions={<MemberForm />} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="নাম, মোবাইল বা সদস্য নং দিয়ে খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <DataTable
        head={["সদস্য নং", "নাম", "মোবাইল", "কেন্দ্র", "ভর্তির তারিখ", "অবস্থা", ""]}
        rows={list.map((m) => [
          m.member_no, <span key="n" className="font-medium">{m.name}</span>, m.phone, centerName.get(m.center_id ?? "") ?? "—", bnDate(m.admission_date),
          <Badge key="s" variant={m.status === "active" ? "default" : "secondary"}>{m.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>,
          <div key="v" className="flex gap-1"><MemberForm member={m} /><Button asChild size="sm" variant="outline"><Link to="/members/$id" params={{ id: m.id }}>বিস্তারিত</Link></Button></div>,
        ])}
      />

    </div>
  );
}
