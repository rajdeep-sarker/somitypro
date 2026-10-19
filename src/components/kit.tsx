import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRows } from "@/lib/db";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 grid min-w-0 gap-3 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl text-foreground md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "primary", icon }: { label: string; value: ReactNode; hint?: string; tone?: "primary" | "gold" | "success" | "destructive"; icon?: ReactNode }) {
  const toneCls = {
    primary: "bg-secondary text-primary",
    gold: "bg-accent text-accent-foreground",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Card className="flex items-start gap-3 p-4 shadow-card">
      {icon && <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", toneCls)}>{icon}</div>}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm text-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function MemberSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: members = [] } = useRows("members", { order: "member_no", ascending: true });
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="সদস্য নির্বাচন করুন" />
      </SelectTrigger>
      <SelectContent>
        {members.filter((m) => m.status === "active").map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.member_no} — {m.name} {m.phone ? `(${m.phone})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SimpleSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? "নির্বাচন করুন"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DataTable({ head, rows, empty = "কোনো তথ্য পাওয়া যায়নি", foot }: { head: ReactNode[]; rows: ReactNode[][]; empty?: string; foot?: ReactNode[] }) {
  return (
    <Card className="min-w-0 max-w-full overflow-hidden shadow-card">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              {head.map((h, i) => (
                <th key={i} className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={head.length} className="px-3 py-10 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/50">
                {r.map((c, j) => (
                  <td key={j} className="whitespace-nowrap px-3 py-2">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {foot && rows.length > 0 && (
            <tfoot className="border-t-2 border-border bg-muted font-semibold">
              <tr>
                {foot.map((c, i) => (
                  <td key={i} className="whitespace-nowrap px-3 py-2">
                    {c}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}

export function FormCard({ title, children, onSubmit }: { title: string; children: ReactNode; onSubmit: () => void }) {
  return (
    <Card className="p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
      </form>
    </Card>
  );
}

export function useMemberMap() {
  const { data = [] } = useRows("members");
  return new Map(data.map((m) => [m.id, m]));
}
