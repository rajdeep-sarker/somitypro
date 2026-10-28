import { useLang } from "@/lib/i18n";
import { uiText } from "@/lib/ui-translation";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { bn, taka } from "@/lib/format";

type Txn = { txn_date: string; amount: number | string; type?: string; late_fee?: number | string };
const months = ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function lastMonths(n: number) {
  const d = new Date();
  return Array.from({ length: n }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth() - (n - 1 - i), 1);
    return { key: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`, label: uiText(months[x.getMonth()] ?? "") };
  });
}
const byMonth = (rows: Txn[], key: string, pick: (r: Txn) => number) =>
  rows.filter((r) => r.txn_date?.startsWith(key)).reduce((a, r) => a + pick(r), 0);

const tip = (v: number) => taka(v);
const axis = (v: number) => (v >= 1000 ? `${bn(Math.round(v / 1000))}k` : bn(v));

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  useLang();

  return (
    <Card className="p-4 shadow-card">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="h-64"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
    </Card>
  );
}

export function DashboardCharts(p: {
  sav: Txn[]; rep: Txn[]; dps: Txn[]; fees: Txn[]; cash: Txn[];
  members: { admission_date: string }[];
  loanCounts: { active: number; overdue: number; closed: number };
  mix: { savings: number; dps: number; fdr: number; loanOut: number };
}) {
  useLang();

  const ms = lastMonths(6);
  const collection = ms.map((m) => ({
    name: m.label,
    [uiText("সঞ্চয়")]: byMonth(p.sav.filter((t) => t.type !== "withdraw"), m.key, (t) => Number(t.amount)),
    [uiText("লোন")]: byMonth(p.rep, m.key, (t) => Number(t.amount) + Number(t.late_fee ?? 0)),
    DPS: byMonth(p.dps.filter((t) => t.type === "deposit"), m.key, (t) => Number(t.amount)),
    [uiText("ফি")]: byMonth(p.fees, m.key, (t) => Number(t.amount)),
  }));
  const flow = ms.map((m) => ({
    name: m.label,
    [uiText("জমা")]: byMonth(p.sav.filter((t) => t.type !== "withdraw"), m.key, (t) => Number(t.amount)),
    [uiText("উত্তোলন")]: byMonth(p.sav.filter((t) => t.type === "withdraw"), m.key, (t) => Number(t.amount)),
  }));
  const income = ms.map((m) => ({
    name: m.label,
    [uiText("আয়")]: byMonth(p.cash.filter((t) => t.type === "income"), m.key, (t) => Number(t.amount)),
    [uiText("ব্যয়")]: byMonth(p.cash.filter((t) => t.type === "expense"), m.key, (t) => Number(t.amount)),
  }));
  let running = p.members.filter((m) => m.admission_date < `${ms[0]?.key ?? ""}-01`).length;
  const growth = ms.map((m) => {
    running += p.members.filter((x) => x.admission_date?.startsWith(m.key)).length;
    return { name: m.label, [uiText("সদস্য")]: running };
  });
  const loanPie = [
    { name: uiText("নিয়মিত"), value: p.loanCounts.active - p.loanCounts.overdue, fill: C[2] },
    { name: uiText("মেয়াদোত্তীর্ণ"), value: p.loanCounts.overdue, fill: C[3] },
    { name: uiText("পরিশোধিত"), value: p.loanCounts.closed, fill: C[0] },
  ].filter((x) => x.value > 0);
  const mixPie = [
    { name: uiText("সঞ্চয়"), value: p.mix.savings, fill: C[0] },
    { name: "DPS", value: p.mix.dps, fill: C[1] },
    { name: "FDR", value: p.mix.fdr, fill: C[4] },
    { name: uiText("বাকি ঋণ"), value: p.mix.loanOut, fill: C[3] },
  ].filter((x) => x.value > 0);
  const empty = <p className="flex h-full items-center justify-center text-muted-foreground">{uiText("এখনো তথ্য নেই")}</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title={uiText("মাসিক কালেকশন (শেষ ৬ মাস)")}>
        <BarChart data={collection}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={axis} width={40} /><Tooltip formatter={tip} /><Legend />
          {[uiText("সঞ্চয়"), uiText("লোন"), "DPS", uiText("ফি")].map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={C[i]} radius={i === 3 ? [4, 4, 0, 0] : 0} />)}
        </BarChart>
      </ChartCard>
      <ChartCard title={uiText("তহবিলের বণ্টন")}>
        {mixPie.length ? <PieChart><Pie data={mixPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{mixPie.map((x) => <Cell key={x.name} fill={x.fill} />)}</Pie><Tooltip formatter={tip} /><Legend /></PieChart> : empty}
      </ChartCard>
      <ChartCard title={uiText("সঞ্চয় জমা বনাম উত্তোলন")}>
        <AreaChart data={flow}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={axis} width={40} /><Tooltip formatter={tip} /><Legend />
          <Area type="monotone" dataKey={uiText("জমা")} stroke={C[2]} fill={C[2]} fillOpacity={0.25} /><Area type="monotone" dataKey={uiText("উত্তোলন")} stroke={C[3]} fill={C[3]} fillOpacity={0.2} />
        </AreaChart>
      </ChartCard>
      <ChartCard title={uiText("লোনের অবস্থা")}>
        {loanPie.length ? <PieChart><Pie data={loanPie} dataKey="value" nameKey="name" outerRadius={90} label={(e) => bn(e.value)}>{loanPie.map((x) => <Cell key={x.name} fill={x.fill} />)}</Pie><Tooltip formatter={(v: number) => `${bn(v)} টি`} /><Legend /></PieChart> : empty}
      </ChartCard>
      <ChartCard title={uiText("সদস্য বৃদ্ধি")}>
        <AreaChart data={growth}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} tickFormatter={(v) => bn(v)} width={40} /><Tooltip formatter={(v: number) => `${bn(v)} জন`} />
          <Area type="monotone" dataKey={uiText("সদস্য")} stroke={C[0]} fill={C[0]} fillOpacity={0.25} />
        </AreaChart>
      </ChartCard>
      <ChartCard title={uiText("আয় বনাম ব্যয় (জমা খরচ)")}>
        <BarChart data={income}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={axis} width={40} /><Tooltip formatter={tip} /><Legend />
          <Bar dataKey={uiText("আয়")} fill={C[2]} radius={[4, 4, 0, 0]} /><Bar dataKey={uiText("ব্যয়")} fill={C[3]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}
