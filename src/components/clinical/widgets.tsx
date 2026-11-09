import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDemo } from "@/lib/clinical/demo-context";
import type { Sample } from "@/lib/clinical/data";
import type { RiskLevel } from "@/lib/clinical/risk";
import { fmtDateTime, fmtNum, fmtTime } from "@/lib/clinical/format";
import { cn } from "@/lib/utils";

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card shadow-panel", className)}>
      {title && <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">{title}</h2>{action}</header>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="mb-4"><h1 className="text-xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}</div>;
}

const RISK_STYLE: Record<RiskLevel, string> = {
  LOW: "bg-risk-low-soft text-risk-low border-risk-low/40",
  MODERATE: "bg-risk-moderate-soft text-risk-moderate border-risk-moderate/40",
  HIGH: "bg-risk-high-soft text-risk-high border-risk-high/40",
};
export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold tracking-wide", RISK_STYLE[level], className)}>{level}</span>;
}

// ---------- Patient header ----------
export function PatientHeader() {
  const { scenario, risk } = useDemo();
  const status = risk.level === "HIGH" ? "Unstable — review required" : risk.level === "MODERATE" ? "Under close observation" : "Stable";
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div><div className="text-xs text-muted-foreground">Patient</div><div className="font-mono text-lg font-semibold">{scenario.patientId}</div></div>
        <Field k="Bed" v={`MICU ${scenario.bed}`} />
        <Field k="Age / Sex" v={`${scenario.age} / ${scenario.sex}`} />
        <Field k="Weight" v={`${scenario.weightKg} kg`} />
        <Field k="Diagnosis" v={scenario.diagnosis} />
        <div><div className="text-xs text-muted-foreground">Status</div><div className="flex items-center gap-2 text-sm font-medium"><RiskBadge level={risk.level} />{status}</div></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Scenario: {scenario.label} — {scenario.description}</p>
    </Panel>
  );
}
const Field = ({ k, v }: { k: string; v: string }) => <div><div className="text-xs text-muted-foreground">{k}</div><div className="text-sm font-medium">{v}</div></div>;

// ---------- Vitals ----------
type Key = keyof Omit<Sample, "t">;
interface VitalDef { key: Key; label: string; unit: string; d: number; concern?: (v: number, wkg: number) => boolean; higherIsWorse?: boolean; }
const VITALS: VitalDef[] = [
  { key: "map", label: "Mean arterial pressure", unit: "mmHg", d: 0, concern: (v) => v < 65 },
  { key: "sbp", label: "Blood pressure", unit: "mmHg", d: 0 },
  { key: "hr", label: "Heart rate", unit: "bpm", d: 0, concern: (v) => v > 110 || v < 50, higherIsWorse: true },
  { key: "spo2", label: "Oxygen saturation", unit: "%", d: 0, concern: (v) => v < 92 },
  { key: "rr", label: "Respiratory rate", unit: "/min", d: 0, concern: (v) => v > 24, higherIsWorse: true },
  { key: "temp", label: "Temperature", unit: "°C", d: 1, concern: (v) => v >= 38.3, higherIsWorse: true },
  { key: "lactate", label: "Lactate", unit: "mmol/L", d: 1, concern: (v) => v >= 2, higherIsWorse: true },
  { key: "urine", label: "Urine output", unit: "mL/h", d: 0, concern: (v, w) => v / w < 0.5 },
  { key: "vasopressin", label: "Vasopressin", unit: "U/min", d: 2, higherIsWorse: true },
  { key: "norepinephrine", label: "Norepinephrine", unit: "mcg/kg/min", d: 2, concern: (v) => v >= 0.25, higherIsWorse: true },
];

function lastOf(samples: Sample[], key: Key, offset = 0) {
  let seen = 0;
  for (let i = samples.length - 1; i >= 0; i--) {
    const v = samples[i]![key];
    if (v != null) { if (seen === offset) return { v: v as number, t: samples[i]!.t }; seen++; }
  }
  return null;
}

export function VitalsGrid() {
  const { samples, scenario } = useDemo();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {VITALS.map((def) => {
        const cur = lastOf(samples, def.key);
        // compare against value ~2 h earlier for sparse vars, 8 samples for continuous
        const sparse = def.key === "lactate" || def.key === "urine";
        const prev = sparse ? lastOf(samples, def.key, def.key === "lactate" ? 1 : 2) : { v: samples[samples.length - 9]![def.key] as number, t: 0 };
        const delta = cur && prev ? cur.v - prev.v : 0;
        const eps = def.d === 0 ? 1.5 : def.d === 1 ? 0.15 : 0.005;
        const dir = Math.abs(delta) < eps ? 0 : delta > 0 ? 1 : -1;
        const concern = cur && def.concern?.(cur.v, scenario.weightKg);
        const display = def.key === "sbp" ? `${fmtNum(cur?.v)}/${fmtNum(samples[samples.length - 1]!.dbp)}` : fmtNum(cur?.v, def.d);
        const TrendIcon = dir === 0 ? ArrowRight : dir > 0 ? ArrowUpRight : ArrowDownRight;
        return (
          <div key={def.key} className={cn("rounded-lg border bg-card p-3 shadow-panel", concern ? "border-risk-high/50" : "border-border")}>
            <div className="flex items-start justify-between gap-1">
              <span className="text-xs font-medium text-muted-foreground">{def.label}</span>
              <span className={cn("flex items-center text-[11px]", dir === 0 ? "text-muted-foreground" : "text-foreground")} title="Change vs ~2 h earlier">
                <TrendIcon className="h-3.5 w-3.5" aria-hidden />{dir !== 0 && <span className="sr-only">{dir > 0 ? "rising" : "falling"}</span>}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={cn("font-mono text-2xl font-semibold tabular-nums", concern && "text-risk-high")}>{display}</span>
              <span className="text-xs text-muted-foreground">{def.unit}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{cur ? fmtTime(cur.t) : "No data"}{dir !== 0 && ` · ${delta > 0 ? "+" : ""}${delta.toFixed(def.d)} vs 2 h`}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Risk card ----------
export function RiskCard({ compact = false }: { compact?: boolean }) {
  const { risk, now } = useDemo();
  const Icon = risk.level === "LOW" ? CheckCircle2 : AlertTriangle;
  return (
    <Panel title="Perfusion risk assessment" action={<span className="text-[11px] text-muted-foreground">Illustrative rules · not an AI model</span>}>
      <div className={cn("flex items-center gap-4 rounded-md border p-4", RISK_STYLE[risk.level])}>
        <Icon className="h-8 w-8 shrink-0" aria-hidden />
        <div>
          <div className="text-xs font-medium uppercase tracking-wider opacity-80">Current illustrative risk level</div>
          <div className="text-2xl font-bold tracking-wide">{risk.level}</div>
          <div className="text-[11px] opacity-80">Evaluated {fmtDateTime(now)} · rule score {risk.score}</div>
        </div>
      </div>
      <p className="mt-3 text-sm">{risk.explanation}</p>
      <div className={cn("mt-4 grid gap-4", !compact && "md:grid-cols-2")}>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Main contributing indicators</h3>
          {risk.contributors.length === 0 ? <p className="text-sm text-muted-foreground">None currently met.</p> : (
            <ul className="space-y-1.5">{risk.contributors.map((c) => (
              <li key={c.label} className="flex items-start justify-between gap-2 rounded border border-border px-3 py-2 text-sm">
                <span><span className="font-medium">{c.label}</span><span className="block text-xs text-muted-foreground">{c.detail}</span></span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">+{c.points}</span>
              </li>))}</ul>)}
        </div>
        {!compact && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change over ~6 h</h3>
            <table className="w-full text-sm"><tbody>{risk.changes.map((c) => (
              <tr key={c.label} className="border-b border-border last:border-0">
                <td className="py-1.5">{c.label}</td>
                <td className="py-1.5 text-right font-mono tabular-nums">{c.from.toFixed(c.decimals)} → {c.to.toFixed(c.decimals)}</td>
                <td className="py-1.5 pl-2 text-xs text-muted-foreground">{c.unit}</td>
              </tr>))}</tbody></table>
          </div>
        )}
      </div>
      {risk.warnings.length > 0 && (
        <div className="mt-4 rounded-md border border-warning/50 bg-warning-soft p-3 text-sm text-warning-foreground">
          <div className="mb-1 flex items-center gap-1.5 font-semibold"><Info className="h-4 w-4" />Missing or unreliable data</div>
          <ul className="list-disc space-y-0.5 pl-5">{risk.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">No probabilities are shown. Categories come from fixed illustrative thresholds and have not been clinically validated.</p>
    </Panel>
  );
}

// ---------- Trend charts ----------
const SERIES = [
  { key: "map", label: "MAP", unit: "mmHg", ref: 65, refLabel: "65", worse: "down", color: "var(--chart-1)" },
  { key: "lactate", label: "Lactate", unit: "mmol/L", ref: 2, refLabel: "2.0", worse: "up", color: "var(--chart-2)" },
  { key: "urine", label: "Urine output", unit: "mL/h", ref: undefined, refLabel: "", worse: "down", color: "var(--chart-3)" },
  { key: "norepinephrine", label: "Norepinephrine", unit: "mcg/kg/min", ref: undefined, refLabel: "", worse: "up", color: "var(--chart-4)" },
  { key: "vasopressin", label: "Vasopressin", unit: "U/min", ref: undefined, refLabel: "", worse: "up", color: "var(--chart-5)" },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];
const RANGES = [1, 6, 12, 24];

export function TrendCharts({ defaultRange = 12 }: { defaultRange?: number }) {
  const { samples, scenario } = useDemo();
  const [range, setRange] = useState(defaultRange);
  const [sel, setSel] = useState<SeriesKey[]>(["map", "lactate", "urine", "norepinephrine"]);
  const data = useMemo(() => samples.slice(-(range * 4 + 1)), [samples, range]);
  const toggle = (k: SeriesKey) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  return (
    <Panel title="Trends" action={
      <div role="group" aria-label="Time range" className="flex rounded-md border border-border p-0.5">
        {RANGES.map((r) => <button key={r} onClick={() => setRange(r)} aria-pressed={range === r}
          className={cn("rounded px-2.5 py-1 text-xs font-medium", range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{r} h</button>)}
      </div>}>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Variables">
        {SERIES.map((s) => (
          <label key={s.key} className={cn("flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs", sel.includes(s.key) ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground")}>
            <input type="checkbox" className="sr-only" checked={sel.includes(s.key)} onChange={() => toggle(s.key)} />
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}
          </label>))}
      </div>
      {sel.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Select at least one variable.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {SERIES.filter((s) => sel.includes(s.key)).map((s) => {
          const pts = data.map((d) => d[s.key]).filter((v): v is number => v != null);
          const first = pts[0], lastV = pts[pts.length - 1] ?? 0;
          const rel = first ? (lastV - first) / Math.max(Math.abs(first), 0.01) : 0;
          const concerning = pts.length > 1 && ((s.worse === "down" && rel < -0.1) || (s.worse === "up" && rel > 0.15));
          const urineRef = s.key === "urine" ? 0.5 * scenario.weightKg : s.ref;
          return (
            <div key={s.key} className={cn("rounded-md border p-3", concerning ? "border-risk-moderate/60 bg-risk-moderate-soft/40" : "border-border")}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold">{s.label} <span className="font-normal text-muted-foreground">({s.unit})</span></span>
                {concerning ? <span className="flex items-center gap-1 font-medium text-risk-moderate"><AlertTriangle className="h-3.5 w-3.5" />Trend {s.worse === "down" ? "falling" : "rising"} {Math.abs(rel * 100).toFixed(0)}% in {range} h</span>
                  : <span className="text-muted-foreground">No notable trend</span>}
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="t" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={30} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} domain={["auto", "auto"]} />
                    <Tooltip labelFormatter={(t) => fmtDateTime(Number(t))} formatter={(v: number) => [`${v} ${s.unit}`, s.label]} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--border)" }} />
                    {urineRef != null && <ReferenceLine y={urineRef} stroke="var(--risk-high)" strokeDasharray="4 4" label={{ value: s.key === "urine" ? "0.5 mL/kg/h" : s.refLabel, fontSize: 10, fill: "var(--risk-high)", position: "insideTopRight" }} />}
                    <Line type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={s.key === "lactate" || (s.key === "urine" && range <= 6) ? { r: 2.5 } : false} connectNulls isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>);
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Trend highlights flag changes for review only; they do not diagnose hypoperfusion.</p>
    </Panel>
  );
}

// ---------- GI panel ----------
export function GiPanel({ compact = false }: { compact?: boolean }) {
  const { gi } = useDemo();
  const statusStyle = gi.feedingStatus === "Running" ? RISK_STYLE.LOW : RISK_STYLE.MODERATE;
  const rows: [string, string, boolean][] = [
    ["Vomiting / regurgitation", gi.vomiting, !gi.vomiting.startsWith("None")],
    ["Abdominal distension", gi.distension, !gi.distension.startsWith("None")],
    ["Abdominal pain", gi.pain, false],
  ];
  return (
    <Panel title="Gastrointestinal monitoring" action={<span className="text-[11px] text-muted-foreground">Documented separately from perfusion risk</span>}>
      <div className="flex flex-wrap items-center gap-4">
        <div><div className="text-xs text-muted-foreground">Enteral feeding</div><span className={cn("mt-0.5 inline-block rounded border px-2 py-0.5 text-xs font-semibold", statusStyle)}>{gi.feedingStatus}</span></div>
        <div><div className="text-xs text-muted-foreground">Rate (current / goal)</div><div className="font-mono text-sm font-semibold">{gi.currentRate} / {gi.goalRate} mL/h</div></div>
        <div><div className="text-xs text-muted-foreground">Route</div><div className="text-sm font-medium">{gi.route}</div></div>
        <div><div className="text-xs text-muted-foreground">Documented warning signs</div><div className="text-sm font-semibold">{gi.warningCount}</div></div>
      </div>
      <dl className="mt-4 divide-y divide-border rounded-md border border-border text-sm">
        {rows.map(([k, v, flag]) => <div key={k} className="flex justify-between gap-3 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className={cn("text-right font-medium", flag && "text-risk-moderate")}>{v}</dd></div>)}
      </dl>
      {!compact && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feeding interruptions (24 h)</h3>
            {gi.interruptions.length === 0 ? <p className="text-sm text-muted-foreground">None documented.</p> :
              <ul className="space-y-1 text-sm">{gi.interruptions.map((e) => <li key={e.t} className="flex gap-3"><span className="font-mono text-xs text-muted-foreground">{fmtTime(e.t)}</span>{e.text}</li>)}</ul>}
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Other documented GI signs</h3>
            {gi.other.length === 0 ? <p className="text-sm text-muted-foreground">None documented.</p> :
              <ul className="list-disc space-y-1 pl-5 text-sm">{gi.other.map((o) => <li key={o}>{o}</li>)}</ul>}
          </div>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">Feeding intolerance findings are not proof of intestinal ischemia or physical feeding-tube blockage. Feeding orders are managed by the clinical team only.</p>
    </Panel>
  );
}
