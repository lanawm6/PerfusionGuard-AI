// Simulated, fictional patient data only. Deterministic so SSR and client render identically.
export type ScenarioId = "stable" | "emerging" | "multiple" | "gi";

export interface Sample {
  t: number; // epoch ms
  map: number;
  sbp: number;
  dbp: number;
  hr: number;
  spo2: number;
  rr: number;
  temp: number;
  lactate: number | null; // sampled every 2 h
  urine: number | null; // mL/h, charted hourly
  vasopressin: number; // U/min
  norepinephrine: number; // mcg/kg/min
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  patientId: string;
  bed: string;
  age: number;
  sex: "M" | "F";
  weightKg: number;
  diagnosis: string;
  dataQuality: (hour: number) => string[];
}

export const ANCHOR = Date.UTC(2026, 10, 9, 8, 0); // demo "now" at step 0
export const SAMPLE_MIN = 15;

export const SCENARIOS: Scenario[] = [
  {
    id: "stable",
    label: "Stable patient",
    description: "Hemodynamics stable on low-dose vasopressor support.",
    patientId: "ICU-0412",
    bed: "Bed 04",
    age: 61,
    sex: "M",
    weightKg: 78,
    diagnosis: "Septic Shock",
    dataQuality: () => [],
  },
  {
    id: "emerging",
    label: "Emerging perfusion concerns",
    description: "Gradual MAP decline with rising lactate over recent hours.",
    patientId: "ICU-0728",
    bed: "Bed 07",
    age: 54,
    sex: "F",
    weightKg: 66,
    diagnosis: "Septic Shock",
    dataQuality: () => [],
  },
  {
    id: "multiple",
    label: "Multiple concerning trends",
    description: "Falling MAP, rising lactate, oliguria and escalating vasopressors.",
    patientId: "ICU-1103",
    bed: "Bed 11",
    age: 72,
    sex: "M",
    weightKg: 84,
    diagnosis: "Septic Shock",
    dataQuality: () => [
      "SpO₂ waveform flagged as low signal quality in the last hour (possible peripheral vasoconstriction).",
    ],
  },
  {
    id: "gi",
    label: "Gastrointestinal warning signs",
    description: "Systemically stable; feeding interruptions and abdominal findings documented.",
    patientId: "ICU-0915",
    bed: "Bed 09",
    age: 47,
    sex: "F",
    weightKg: 70,
    diagnosis: "Septic Shock",
    dataQuality: () => [],
  },
];

export const getScenario = (id: ScenarioId) => SCENARIOS.find((s) => s.id === id)!;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ramp = (h: number, start: number, end: number) => clamp((h - start) / (end - start), 0, 1);
const noise = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};
const r1 = (v: number, d = 0) => Math.round(v * 10 ** d) / 10 ** d;

type Base = Omit<Sample, "t" | "sbp" | "dbp">;

function trajectory(id: ScenarioId, h: number): Base {
  switch (id) {
    case "stable": {
      const r = ramp(h, 0, 30);
      return { map: 76 + 2 * r, hr: 90 - 6 * r, spo2: 97, rr: 16, temp: 37.3 - 0.3 * r, lactate: 1.7 - 0.5 * r, urine: 62 + 6 * r, vasopressin: 0.03, norepinephrine: 0.08 - 0.04 * r };
    }
    case "emerging": {
      const r = ramp(h, 14, 32);
      return { map: 74 - 9 * r, hr: 92 + 18 * r, spo2: 96 - 2 * r, rr: 18 + 5 * r, temp: 37.6 + 0.7 * r, lactate: 1.6 + 1.6 * r, urine: 58 - 30 * r, vasopressin: 0.03, norepinephrine: 0.08 + 0.1 * r };
    }
    case "multiple": {
      const r = ramp(h, 8, 30);
      return { map: 72 - 17 * r, hr: 98 + 30 * r, spo2: 95 - 5 * r, rr: 20 + 9 * r, temp: 38.0 + 0.8 * r, lactate: 1.8 + 3.8 * r, urine: 55 - 42 * r, vasopressin: h > 14 ? 0.04 : 0.03, norepinephrine: 0.1 + 0.32 * r };
    }
    case "gi": {
      const r = ramp(h, 0, 30);
      return { map: 73 + r, hr: 94 - 3 * r, spo2: 97, rr: 17, temp: 37.4, lactate: 1.7, urine: 55, vasopressin: 0.03, norepinephrine: 0.06 };
    }
  }
}

const SEED: Record<ScenarioId, number> = { stable: 1, emerging: 2, multiple: 3, gi: 4 };

/** Generates 24 h of history ending at the current demo time (ANCHOR + step hours). */
export function generateSamples(id: ScenarioId, step: number): Sample[] {
  const out: Sample[] = [];
  const perHour = 60 / SAMPLE_MIN;
  const total = 24 * perHour;
  const now = ANCHOR + step * 3600_000;
  const startHour = step; // scenario hour at window start
  for (let k = 0; k <= total; k++) {
    const i = startHour * perHour + k;
    const h = i / perHour;
    const b = trajectory(id, h);
    const s = SEED[id];
    const map = r1(b.map + noise(i, s) * 4);
    const dbp = r1(map * 0.8 + noise(i, s + 9) * 2);
    const minuteOfDay = i * SAMPLE_MIN;
    out.push({
      t: now - (total - k) * SAMPLE_MIN * 60_000,
      map,
      dbp,
      sbp: r1(3 * map - 2 * dbp),
      hr: r1(b.hr + noise(i, s + 1) * 6),
      spo2: r1(clamp(b.spo2 + noise(i, s + 2) * 2, 80, 100)),
      rr: r1(b.rr + noise(i, s + 3) * 3),
      temp: r1(b.temp + noise(i, s + 4) * 0.3, 1),
      lactate: minuteOfDay % 120 === 0 ? r1(Math.max(0.5, (b.lactate ?? 0) + noise(i, s + 5) * 0.3), 1) : null,
      urine: minuteOfDay % 60 === 0 ? r1(Math.max(0, (b.urine ?? 0) + noise(i, s + 6) * 10)) : null,
      vasopressin: b.vasopressin,
      norepinephrine: r1(Math.max(0, b.norepinephrine), 2),
    });
  }
  return out;
}

export const nowFor = (step: number) => ANCHOR + step * 3600_000;

// ---------- Gastrointestinal observations (documented separately) ----------
export interface GiEvent { t: number; text: string; }
export interface GiData {
  feedingStatus: "Running" | "Held" | "Paused" | "Not started";
  route: string;
  currentRate: number; // mL/h
  goalRate: number;
  interruptions: GiEvent[];
  vomiting: string;
  distension: string;
  pain: string;
  other: string[];
  warningCount: number;
}

export function giData(id: ScenarioId, step: number): GiData {
  const now = nowFor(step);
  const ago = (h: number) => now - h * 3600_000;
  if (id === "gi") {
    const interruptions: GiEvent[] = [
      { t: ago(14), text: "Held 2 h — vomiting episode" },
      { t: ago(6), text: "Held 1.5 h — abdominal distension noted" },
      { t: ago(1), text: "Held — pending clinical review" },
    ];
    if (step >= 1) interruptions.push({ t: ago(0.5), text: "Remains held — awaiting team reassessment" });
    const other = [
      "Gastric residual volume 320 mL (documented)",
      "Hypoactive bowel sounds",
      "No stool for 72 h",
    ];
    if (step >= 2) other.push("Abdominal girth increased by 3 cm since previous measurement");
    return {
      feedingStatus: "Held",
      route: "Nasogastric",
      currentRate: 0,
      goalRate: 50,
      interruptions,
      vomiting: step >= 1 ? "2 episodes in last 24 h" : "1 episode in last 24 h",
      distension: step >= 2 ? "Moderate — increasing" : "Mild to moderate",
      pain: "Not reliably assessable (sedated, RASS −3)",
      other,
      warningCount: 3 + (step >= 1 ? 1 : 0) + (step >= 2 ? 1 : 0),
    };
  }
  if (id === "multiple") {
    return {
      feedingStatus: "Paused",
      route: "Nasogastric",
      currentRate: 0,
      goalRate: 55,
      interruptions: [{ t: ago(5), text: "Paused by team during hemodynamic instability" }],
      vomiting: "None documented",
      distension: "None documented",
      pain: "Not reliably assessable (sedated)",
      other: [],
      warningCount: 0,
    };
  }
  return {
    feedingStatus: "Running",
    route: "Nasogastric",
    currentRate: id === "emerging" ? 30 : 45,
    goalRate: id === "emerging" ? 50 : 50,
    interruptions: id === "emerging" ? [{ t: ago(9), text: "Held 30 min — procedure" }] : [],
    vomiting: "None documented",
    distension: "None",
    pain: id === "stable" ? "Denies pain (CPOT 0)" : "CPOT 1",
    other: [],
    warningCount: 0,
  };
}
