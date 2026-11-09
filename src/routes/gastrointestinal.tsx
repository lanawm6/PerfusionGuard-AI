import { createFileRoute } from "@tanstack/react-router";
import { GiPanel, PageTitle, PatientHeader } from "@/components/clinical/widgets";

export const Route = createFileRoute("/gastrointestinal")({
  head: () => ({ meta: [
    { title: "Gastrointestinal Monitoring — PerfusionGuard AI" },
    { name: "description", content: "Enteral feeding status, interruptions and documented gastrointestinal signs for simulated ICU patients." },
    { property: "og:title", content: "Gastrointestinal Monitoring — PerfusionGuard AI" },
    { property: "og:description", content: "Simulated enteral feeding and GI observations." },
  ] }),
  component: () => (
    <div className="space-y-4">
      <PageTitle title="Gastrointestinal Monitoring" subtitle="Observations shown separately from systemic perfusion risk" />
      <PatientHeader />
      <GiPanel />
    </div>
  ),
});
