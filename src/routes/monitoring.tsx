import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, PatientHeader, TrendCharts, VitalsGrid } from "@/components/clinical/widgets";

export const Route = createFileRoute("/monitoring")({
  head: () => ({ meta: [
    { title: "Patient Monitoring — PerfusionGuard AI" },
    { name: "description", content: "Simulated vital signs and time-series trends for MAP, lactate, urine output and vasopressors." },
    { property: "og:title", content: "Patient Monitoring — PerfusionGuard AI" },
    { property: "og:description", content: "Simulated ICU vital signs and trends." },
  ] }),
  component: () => (
    <div className="space-y-4">
      <PageTitle title="Patient Monitoring" subtitle="Latest measurements and interactive trends" />
      <PatientHeader />
      <VitalsGrid />
      <TrendCharts defaultRange={24} />
    </div>
  ),
});
