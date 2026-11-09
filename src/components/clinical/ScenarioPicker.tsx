import { RotateCcw, SkipForward } from "lucide-react";
import { useDemo } from "@/lib/clinical/demo-context";
import { SCENARIOS } from "@/lib/clinical/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScenarioPicker() {
  const { scenario, setScenario, progress, reset, step } = useDemo();
  return (
    <section aria-label="Demonstration scenarios" className="rounded-lg border border-dashed border-primary/40 bg-accent/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">Demonstration scenario</h2>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={progress} disabled={step >= 12}><SkipForward className="h-3.5 w-3.5" />Simulate +1 hour</Button>
          <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="h-3.5 w-3.5" />Reset demo</Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup">
        {SCENARIOS.map((s) => (
          <button key={s.id} role="radio" aria-checked={scenario.id === s.id} onClick={() => setScenario(s.id)}
            className={cn("rounded-md border bg-card p-2.5 text-left transition-colors", scenario.id === s.id ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50")}>
            <div className="text-sm font-medium">{s.label}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{s.patientId}</div>
          </button>))}
      </div>
    </section>
  );
}
