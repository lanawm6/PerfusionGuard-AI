import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel, RiskCard, TrendCharts } from "@/components/clinical/widgets";
import { THRESHOLDS } from "@/lib/clinical/risk";

export const Route = createFileRoute("/risk")({
  head: () => ({ meta: [
    { title: "Perfusion Risk Assessment — PerfusionGuard AI" },
    { name: "description", content: "Explainable, illustrative rule-based perfusion risk category with contributing indicators." },
    { property: "og:title", content: "Perfusion Risk Assessment — PerfusionGuard AI" },
    { property: "og:description", content: "Illustrative rule-based perfusion risk with explanations." },
  ] }),
  component: RiskPage,
});

function RiskPage() {
  const rules = [
    ["MAP < 65 mmHg (1-h mean)", "+2"], ["MAP 65–70 mmHg", "+1"], [`Lactate ≥ ${THRESHOLDS.lactateHigh} mmol/L`, "+2"], [`Lactate ≥ ${THRESHOLDS.lactateElevated} mmol/L`, "+1"],
    [`Lactate rise ≥ ${THRESHOLDS.lactateRiseDelta} mmol/L over ~6 h`, "+1"], ["Urine output < 0.3 mL/kg/h (3-h mean)", "+2"], ["Urine output < 0.5 mL/kg/h", "+1"],
    ["Vasopressor escalation over 6 h", "+1"], [`Heart rate > ${THRESHOLDS.hrHigh} bpm`, "+1"],
  ];
  return (
    <div className="space-y-4">
      <PageTitle title="Perfusion Risk Assessment" subtitle="Illustrative rules — not a trained or validated AI model" />
      <RiskCard />
      <TrendCharts defaultRange={12} />
      <Panel title="Illustrative rule set">
        <table className="w-full text-sm"><tbody>{rules.map(([r, p]) => <tr key={r} className="border-b border-border last:border-0"><td className="py-1.5">{r}</td><td className="py-1.5 text-right font-mono">{p}</td></tr>)}</tbody></table>
        <p className="mt-3 text-xs text-muted-foreground">Category: LOW 0–1 · MODERATE 2–4 · HIGH ≥ 5. Thresholds are placeholders for demonstration; the scoring module is isolated so a validated model can replace it.</p>
      </Panel>
    </div>
  );
}
