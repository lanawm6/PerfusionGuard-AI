// Illustrative rule-based assessment. NOT a trained or validated model.
// Interface is intentionally narrow so a validated model can replace `assessPerfusionRisk` later.
import type { Sample } from "./data";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export interface Contributor { label: string; detail: string; points: number; }
export interface Change { label: string; from: number; to: number; unit: string; decimals: number; }
export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  contributors: Contributor[];
  changes: Change[];
  warnings: string[];
  explanation: string;
  method: "illustrative-rules";
}

export const THRESHOLDS = {
  mapLow: 65,
  mapBorderline: 70,
  lactateHigh: 4,
  lactateElevated: 2,
  lactateRiseDelta: 0.5,
  urineLowMlKgH: 0.5,
  urineVeryLowMlKgH: 0.3,
  hrHigh: 110,
  lactateStaleHours: 3,
};

const last = <T,>(arr: (T | null)[]): { v: T; i: number } | null => {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return { v: arr[i] as T, i };
  return null;
};
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

/** Assess using samples up to and including `upTo` (index). */
export function assessPerfusionRisk(all: Sample[], weightKg: number, upTo = all.length - 1, extraWarnings: string[] = []): RiskAssessment {
  const s = all.slice(0, upTo + 1);
  const now = s[s.length - 1]!;
  const perHour = 4;
  const recent = s.slice(-perHour); // last hour
  const sixAgo = s[Math.max(0, s.length - 1 - 6 * perHour)]!;
  const contributors: Contributor[] = [];
  const warnings: string[] = [...extraWarnings];

  const mapNow = avg(recent.map((x) => x.map));
  if (mapNow < THRESHOLDS.mapLow) contributors.push({ label: "MAP below 65 mmHg", detail: `1-h mean ${mapNow.toFixed(0)} mmHg`, points: 2 });
  else if (mapNow < THRESHOLDS.mapBorderline) contributors.push({ label: "MAP borderline (65–70 mmHg)", detail: `1-h mean ${mapNow.toFixed(0)} mmHg`, points: 1 });

  const lac = last(s.map((x) => x.lactate));
  const lacPrev = last(s.slice(0, Math.max(0, s.length - 6 * perHour)).map((x) => x.lactate));
  if (lac) {
    if (lac.v >= THRESHOLDS.lactateHigh) contributors.push({ label: "Lactate ≥ 4 mmol/L", detail: `${lac.v.toFixed(1)} mmol/L`, points: 2 });
    else if (lac.v >= THRESHOLDS.lactateElevated) contributors.push({ label: "Lactate elevated (≥ 2 mmol/L)", detail: `${lac.v.toFixed(1)} mmol/L`, points: 1 });
    if (lacPrev && lac.v - lacPrev.v >= THRESHOLDS.lactateRiseDelta)
      contributors.push({ label: "Rising lactate", detail: `+${(lac.v - lacPrev.v).toFixed(1)} mmol/L over ~6 h`, points: 1 });
    const ageH = (now.t - s[lac.i].t) / 3600_000;
    if (ageH >= THRESHOLDS.lactateStaleHours) warnings.push(`Most recent lactate is ${ageH.toFixed(1)} h old — interpretation limited.`);
  } else warnings.push("No lactate result available in the analysis window.");

  const urines = s.slice(-3 * perHour).map((x) => x.urine).filter((x): x is number => x != null);
  if (urines.length < 2) warnings.push("Fewer than 2 hourly urine output values in the last 3 h.");
  else {
    const perKg = avg(urines) / weightKg;
    if (perKg < THRESHOLDS.urineVeryLowMlKgH) contributors.push({ label: "Urine output < 0.3 mL/kg/h", detail: `${perKg.toFixed(2)} mL/kg/h (3-h mean)`, points: 2 });
    else if (perKg < THRESHOLDS.urineLowMlKgH) contributors.push({ label: "Urine output < 0.5 mL/kg/h", detail: `${perKg.toFixed(2)} mL/kg/h (3-h mean)`, points: 1 });
  }

  if (now.norepinephrine - sixAgo.norepinephrine >= 0.05 || now.vasopressin > sixAgo.vasopressin)
    contributors.push({ label: "Escalating vasopressor support", detail: `Norepinephrine ${sixAgo.norepinephrine.toFixed(2)} → ${now.norepinephrine.toFixed(2)} mcg/kg/min`, points: 1 });

  const hrNow = avg(recent.map((x) => x.hr));
  if (hrNow > THRESHOLDS.hrHigh) contributors.push({ label: "Tachycardia (> 110 bpm)", detail: `1-h mean ${hrNow.toFixed(0)} bpm`, points: 1 });

  const score = contributors.reduce((a, c) => a + c.points, 0);
  const level: RiskLevel = score >= 5 ? "HIGH" : score >= 2 ? "MODERATE" : "LOW";

  const changes: Change[] = [
    { label: "MAP", from: sixAgo.map, to: now.map, unit: "mmHg", decimals: 0 },
    { label: "Heart rate", from: sixAgo.hr, to: now.hr, unit: "bpm", decimals: 0 },
    { label: "Lactate", from: lacPrev?.v ?? lac?.v ?? 0, to: lac?.v ?? 0, unit: "mmol/L", decimals: 1 },
    { label: "Norepinephrine", from: sixAgo.norepinephrine, to: now.norepinephrine, unit: "mcg/kg/min", decimals: 2 },
  ];

  const explanation =
    contributors.length === 0
      ? "No illustrative rule thresholds are currently met. Continue routine monitoring."
      : `Category assigned because ${contributors.length} illustrative rule${contributors.length > 1 ? "s were" : " was"} met (rule score ${score}; LOW 0–1, MODERATE 2–4, HIGH ≥ 5): ${contributors.map((c) => c.label.toLowerCase()).join("; ")}.`;

  return { level, score, contributors, changes, warnings, explanation, method: "illustrative-rules" };
}
