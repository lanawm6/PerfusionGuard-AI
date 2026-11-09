import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { PageTitle, Panel } from "@/components/clinical/widgets";

export const Route = createFileRoute("/research")({
  head: () => ({ meta: [
    { title: "Research Analytics — PerfusionGuard AI" },
    { name: "description", content: "Placeholder fields for future model validation metrics. No clinical validation results are shown." },
    { property: "og:title", content: "Research Analytics — PerfusionGuard AI" },
    { property: "og:description", content: "Placeholder validation metrics for a research prototype." },
  ] }),
  component: ResearchPage,
});

const METRICS = [
  ["Sensitivity", "Proportion of true events flagged"], ["Specificity", "Proportion of non-events correctly not flagged"],
  ["AUROC", "Discrimination across thresholds"], ["False-alert rate", "Alerts per patient-day without a reference event"],
  ["Prediction lead time", "Median time from alert to reference event"],
];

function ResearchPage() {
  return (
    <div className="space-y-4">
      <PageTitle title="Research Analytics" subtitle="Validation framework for a future trained model" />
      <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning-soft p-3 text-sm text-warning-foreground">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
        <p><strong>Illustrative placeholders.</strong> No validation study has been performed. Values will populate only after evaluation on an approved, labelled dataset.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {METRICS.map(([k, d]) => (
          <Panel key={k}>
            <div className="text-xs font-medium text-muted-foreground">{k}</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-muted-foreground">—</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{d}</div>
            <span className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Placeholder</span>
          </Panel>))}
      </div>
      <Panel title="Planned evaluation">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Retrospective cohort of adult septic shock ICU admissions (to be defined)</li>
          <li>Reference standard and outcome definitions to be agreed with clinical investigators</li>
          <li>Comparison of illustrative rules against a trained model under identical data conditions</li>
        </ul>
      </Panel>
    </div>
  );
}
