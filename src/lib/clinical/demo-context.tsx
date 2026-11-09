import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { generateSamples, getScenario, giData, nowFor, type ScenarioId, type Sample, type GiData, type Scenario } from "./data";
import { assessPerfusionRisk, type RiskAssessment, type RiskLevel } from "./risk";

export type AlertStatus = "Active" | "Acknowledged" | "Reviewed";
export interface ClinicalAlert {
  id: string;
  type: "Perfusion" | "Gastrointestinal" | "Data quality";
  severity: RiskLevel;
  patientId: string;
  t: number;
  findings: string[];
  recommendation: string;
}

interface Ctx {
  scenario: Scenario;
  step: number;
  samples: Sample[];
  latest: Sample;
  risk: RiskAssessment;
  gi: GiData;
  alerts: (ClinicalAlert & { status: AlertStatus })[];
  now: number;
  setScenario: (id: ScenarioId) => void;
  progress: () => void;
  reset: () => void;
  setAlertStatus: (id: string, s: AlertStatus) => void;
}

const DemoCtx = createContext<Ctx | null>(null);

const REASSESS = "Recommend bedside clinical reassessment by the treating team. This tool does not modify treatment or feeding orders.";

function buildAlerts(sc: Scenario, samples: Sample[], gi: GiData, now: number): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  let prev: RiskLevel = "LOW";
  // Evaluate every 2 h across the window (from 6 h in so trends have context).
  for (let i = 24; i < samples.length; i += 8) {
    const r = assessPerfusionRisk(samples, sc.weightKg, i);
    const rank = { LOW: 0, MODERATE: 1, HIGH: 2 };
    if (rank[r.level] > rank[prev]) {
      const hourKey = Math.round(samples[i]!.t / 3600_000);
      alerts.push({
        id: `${sc.id}-perf-${hourKey}`,
        type: "Perfusion",
        severity: r.level,
        patientId: sc.patientId,
        t: samples[i]!.t,
        findings: r.contributors.map((c) => `${c.label} (${c.detail})`),
        recommendation: REASSESS,
      });
    }
    prev = r.level;
  }
  if (gi.warningCount > 0) {
    alerts.push({
      id: `${sc.id}-gi-${gi.warningCount}`,
      type: "Gastrointestinal",
      severity: gi.warningCount >= 5 ? "HIGH" : "MODERATE",
      patientId: sc.patientId,
      t: now - 30 * 60_000,
      findings: [`Feeding ${gi.feedingStatus.toLowerCase()} (goal ${gi.goalRate} mL/h)`, `Vomiting: ${gi.vomiting}`, `Distension: ${gi.distension}`, ...gi.other],
      recommendation: "Recommend clinical review of gastrointestinal findings. Feeding intolerance does not by itself indicate intestinal ischemia or feeding-tube obstruction. " + REASSESS,
    });
  }
  sc.dataQuality(0).forEach((w, k) =>
    alerts.push({ id: `${sc.id}-dq-${k}`, type: "Data quality", severity: "MODERATE", patientId: sc.patientId, t: now - 20 * 60_000, findings: [w], recommendation: "Verify sensor placement and signal before interpreting values." }),
  );
  return alerts.sort((a, b) => b.t - a.t);
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("emerging");
  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, AlertStatus>>({});

  const value = useMemo<Ctx>(() => {
    const scenario = getScenario(scenarioId);
    const samples = generateSamples(scenarioId, step);
    const now = nowFor(step);
    const gi = giData(scenarioId, step);
    const extra = scenario.dataQuality(step);
    const risk = assessPerfusionRisk(samples, scenario.weightKg, samples.length - 1, extra);
    const alerts = buildAlerts(scenario, samples, gi, now).map((a) => ({ ...a, status: statuses[a.id] ?? ("Active" as AlertStatus) }));
    return {
      scenario, step, samples, latest: samples[samples.length - 1]!, risk, gi, alerts, now,
      setScenario: (id) => { setScenarioId(id); setStep(0); },
      progress: () => setStep((s) => Math.min(s + 1, 12)),
      reset: () => { setStep(0); setStatuses({}); },
      setAlertStatus: (id, s) => setStatuses((p) => ({ ...p, [id]: s })),
    };
  }, [scenarioId, step, statuses]);

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export const useDemo = () => {
  const c = useContext(DemoCtx);
  if (!c) throw new Error("useDemo outside DemoProvider");
  return c;
};
