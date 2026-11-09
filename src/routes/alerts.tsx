import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel } from "@/components/clinical/widgets";
import { AlertsTable } from "@/components/clinical/AlertsTable";
import { useDemo } from "@/lib/clinical/demo-context";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [
    { title: "Alerts — PerfusionGuard AI" },
    { name: "description", content: "Alert table with severity, findings and acknowledge/review workflow for simulated patients." },
    { property: "og:title", content: "Alerts — PerfusionGuard AI" },
    { property: "og:description", content: "Simulated ICU alert workflow." },
  ] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { alerts } = useDemo();
  const count = (s: string) => alerts.filter((a) => a.status === s).length;
  return (
    <div className="space-y-4">
      <PageTitle title="Alerts" subtitle="Alerts prompt clinical reassessment only. The application never changes treatment or feeding orders." />
      <div className="grid grid-cols-3 gap-3">
        {["Active", "Acknowledged", "Reviewed"].map((s) => <Panel key={s}><div className="text-xs text-muted-foreground">{s}</div><div className="font-mono text-2xl font-semibold">{count(s)}</div></Panel>)}
      </div>
      <Panel title="Alert log"><AlertsTable /></Panel>
    </div>
  );
}
