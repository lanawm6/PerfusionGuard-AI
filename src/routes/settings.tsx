import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel } from "@/components/clinical/widgets";
import { ScenarioPicker } from "@/components/clinical/ScenarioPicker";
import { useDemo } from "@/lib/clinical/demo-context";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings — PerfusionGuard AI" },
    { name: "description", content: "Demonstration controls, units and data-source information for the PerfusionGuard AI prototype." },
    { property: "og:title", content: "Settings — PerfusionGuard AI" },
    { property: "og:description", content: "Demo settings for the research prototype." },
  ] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { step } = useDemo();
  const rows = [
    ["Data source", "Simulated (fictional patients only)"], ["Risk method", "Illustrative rules (no trained model)"],
    ["Pressure units", "mmHg"], ["Lactate units", "mmol/L"], ["Vasopressor units", "Vasopressin U/min · Norepinephrine mcg/kg/min"],
    ["Time format", "24-hour, simulated unit clock"], ["Simulated time offset", `+${step} h`], ["Order integration", "Disabled — the application cannot change treatment or feeding orders"],
  ];
  return (
    <div className="space-y-4">
      <PageTitle title="Settings" subtitle="Demonstration configuration" />
      <ScenarioPicker />
      <Panel title="Configuration">
        <dl className="divide-y divide-border text-sm">{rows.map(([k, v]) => <div key={k} className="flex flex-wrap justify-between gap-2 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
      </Panel>
    </div>
  );
}
