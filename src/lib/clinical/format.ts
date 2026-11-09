const p = (n: number) => String(n).padStart(2, "0");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Fixed-format, timezone-stable (simulated unit clock) to keep SSR/client output identical.
export const fmtTime = (t: number) => { const d = new Date(t); return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`; };
export const fmtDateTime = (t: number) => { const d = new Date(t); return `${p(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${fmtTime(t)}`; };
export const fmtNum = (v: number | null | undefined, d = 0) => (v == null ? "—" : v.toFixed(d));
