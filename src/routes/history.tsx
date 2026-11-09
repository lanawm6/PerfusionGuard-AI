import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel, PatientHeader } from "@/components/clinical/widgets";
import { useDemo } from "@/lib/clinical/demo-context";
import { fmtDateTime, fmtNum } from "@/lib/clinical/format";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [
    { title: "Patient History — PerfusionGuard AI" },
    { name: "description", content: "Hourly flowsheet of simulated vital signs, labs and vasopressor doses over 24 hours." },
    { property: "og:title", content: "Patient History — PerfusionGuard AI" },
    { property: "og:description", content: "24-hour simulated ICU flowsheet." },
  ] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { samples } = useDemo();
  const hourly = samples.filter((_, i) => i % 4 === 0).reverse();
  const cols: [string, (s: (typeof samples)[number]) => string][] = [
    ["MAP mmHg", (s) => fmtNum(s.map)], ["BP mmHg", (s) => `${fmtNum(s.sbp)}/${fmtNum(s.dbp)}`], ["HR bpm", (s) => fmtNum(s.hr)], ["SpO₂ %", (s) => fmtNum(s.spo2)],
    ["RR /min", (s) => fmtNum(s.rr)], ["Temp °C", (s) => fmtNum(s.temp, 1)], ["Lactate mmol/L", (s) => fmtNum(s.lactate, 1)], ["Urine mL/h", (s) => fmtNum(s.urine)],
    ["Vasopressin U/min", (s) => fmtNum(s.vasopressin, 2)], ["Norepi mcg/kg/min", (s) => fmtNum(s.norepinephrine, 2)],
  ];
  return (
    <div className="space-y-4">
      <PageTitle title="Patient History" subtitle="Hourly flowsheet, last 24 hours (simulated)" />
      <PatientHeader />
      <Panel title="Flowsheet">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 bg-card"><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3 font-medium">Time</th>{cols.map(([h]) => <th key={h} className="py-2 pr-3 text-right font-medium">{h}</th>)}</tr></thead>
            <tbody>{hourly.map((s) => <tr key={s.t} className="border-b border-border last:border-0"><td className="py-1.5 pr-3 font-mono text-xs">{fmtDateTime(s.t)}</td>{cols.map(([h, f]) => <td key={h} className="py-1.5 pr-3 text-right font-mono tabular-nums">{f(s)}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">— indicates no measurement at that hour (lactate sampled every 2 h).</p>
      </Panel>
    </div>
  );
}
