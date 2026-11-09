import { createFileRoute, Link } from "@tanstack/react-router";
import { GiPanel, PageTitle, Panel, PatientHeader, RiskCard, TrendCharts, VitalsGrid } from "@/components/clinical/widgets";
import { AlertsTable } from "@/components/clinical/AlertsTable";
import { ScenarioPicker } from "@/components/clinical/ScenarioPicker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ICU Overview — PerfusionGuard AI" },
      { name: "description", content: "Research prototype ICU dashboard with simulated septic shock patients, vital signs, trends and illustrative perfusion risk." },
      { property: "og:title", content: "ICU Overview — PerfusionGuard AI" },
      { property: "og:description", content: "Research prototype ICU monitoring dashboard using simulated data." },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <div className="space-y-4">
      <PageTitle title="Overview" subtitle="Bedside summary for the selected simulated patient" />
      <ScenarioPicker />
      <PatientHeader />
      <VitalsGrid />
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3"><RiskCard compact /></div>
        <div className="xl:col-span-2"><GiPanel compact /></div>
      </div>
      <TrendCharts defaultRange={6} />
      <Panel title="Recent alerts" action={<Link to="/alerts" className="text-xs font-medium text-primary hover:underline">View all</Link>}><AlertsTable limit={3} /></Panel>
    </div>
  );
}
