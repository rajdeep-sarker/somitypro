import { EditEntry } from "@/components/EditEntry";
import { pageHead } from "@/lib/metadata";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Field, FormCard, PageHeader } from "@/components/kit";
import { useDelete, useInsert, useRows } from "@/lib/db";
import { bn } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/centers")({
  head: () => pageHead("কেন্দ্র সেটআপ"),
  component: Centers,
});

function Centers() {
  const { data: centers = [] } = useRows("centers");
  const { data: members = [] } = useRows("members");
  const ins = useInsert("centers");
  const del = useDelete("centers");
  const [f, setF] = useState({ name: "", code: "", address: "", meeting_day: "" });

  return (
    <div className="space-y-6">
      <PageHeader title="এরিয়া / কেন্দ্র সেটআপ" subtitle="শাখা ও কেন্দ্রের তালিকা" />
      <FormCard title="নতুন কেন্দ্র তৈরি" onSubmit={() => ins.mutate(f, { onSuccess: () => setF({ name: "", code: "", address: "", meeting_day: "" }) })}>
        <Field label="কেন্দ্রের নাম"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="কোড"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
        <Field label="ঠিকানা"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <Field label="মিটিং এর দিন"><Input value={f.meeting_day} onChange={(e) => setF({ ...f, meeting_day: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Button type="submit" disabled={ins.isPending}>সংরক্ষণ করুন</Button></div>
      </FormCard>
      <DataTable
        head={["কোড", "কেন্দ্রের নাম", "ঠিকানা", "মিটিং", "সদস্য", "", ""]}
        rows={centers.map((c) => [
          c.code, c.name, c.address, c.meeting_day, bn(members.filter((m) => m.center_id === c.id).length),
          <EditEntry key="e" table="centers" row={c} />,
          <Button key="d" size="icon" variant="ghost" onClick={() => confirm("মুছে ফেলবেন?") && del.mutate(c.id)}><Trash2 className="size-4 text-destructive" /></Button>,
        ])}
      />
    </div>
  );
}
