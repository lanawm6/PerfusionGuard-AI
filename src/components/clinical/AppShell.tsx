import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity, BarChart3, Bell, Gauge, HeartPulse, History, LayoutDashboard, Menu, RotateCcw, Settings, ShieldAlert, SkipForward, Utensils, X,
} from "lucide-react";
import { useDemo } from "@/lib/clinical/demo-context";
import { SCENARIOS, type ScenarioId } from "@/lib/clinical/data";
import { fmtDateTime } from "@/lib/clinical/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/monitoring", label: "Patient Monitoring", icon: Activity },
  { to: "/risk", label: "Perfusion Risk Assessment", icon: Gauge },
  { to: "/gastrointestinal", label: "Gastrointestinal Monitoring", icon: Utensils },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/history", label: "Patient History", icon: History },
  { to: "/research", label: "Research Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SafetyNotice() {
  return (
    <div role="note" className="flex items-start gap-2 border-b border-warning/40 bg-warning-soft px-4 py-2 text-xs text-warning-foreground">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <strong>RESEARCH PROTOTYPE — NOT FOR CLINICAL DECISION-MAKING.</strong> This demonstration uses simulated patient data and illustrative risk rules. It is not a validated medical device and does not diagnose tissue hypoperfusion, intestinal ischemia, or feeding-tube obstruction.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  const { scenario, setScenario, now, alerts, progress, reset, step } = useDemo();
  const active = alerts.filter((a) => a.status === "Active").length;

  const nav = (
    <nav aria-label="Main" className="flex flex-col gap-0.5 p-3">
      {NAV.map((n) => {
        const on = path === n.to;
        return (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              on ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60")}>
            <n.icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{n.label}</span>
            {n.to === "/alerts" && active > 0 && <span className="rounded-full bg-risk-high px-1.5 text-[10px] font-semibold text-risk-high-foreground">{active}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        {nav}
        <div className="mt-auto border-t border-sidebar-border p-4 text-[11px] text-muted-foreground">Simulated data · v0.2 prototype</div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 bg-sidebar shadow-lg">
            <div className="flex items-center justify-between pr-2"><Brand /><Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></Button></div>
            {nav}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-card">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
            <div className="flex items-center gap-2 lg:hidden"><HeartPulse className="h-5 w-5 text-primary" /><span className="font-semibold">PerfusionGuard AI</span></div>
            <span className="rounded border border-warning/50 bg-warning-soft px-2 py-0.5 text-[11px] font-bold tracking-wider text-warning-foreground">DEMO MODE</span>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Patient</span>
              <select value={scenario.id} onChange={(e) => setScenario(e.target.value as ScenarioId)}
                className="rounded-md border border-input bg-card px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring">
                {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.patientId} · {s.label}</option>)}
              </select>
            </label>
            <span className="text-xs text-muted-foreground">Last update <span className="font-mono text-foreground">{fmtDateTime(now)}</span>{step > 0 && ` (+${step} h)`}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={progress} disabled={step >= 12}><SkipForward className="h-3.5 w-3.5" />+1 h</Button>
              <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="h-3.5 w-3.5" />Reset</Button>
              <Link to="/alerts" aria-label={`${active} active alerts`} className="relative rounded-md p-2 hover:bg-muted">
                <Bell className="h-5 w-5" />
                {active > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-risk-high ring-2 ring-card" />}
              </Link>
            </div>
          </div>
          <SafetyNotice />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><HeartPulse className="h-4 w-4" /></div>
      <div className="leading-tight"><div className="text-sm font-semibold">PerfusionGuard AI</div><div className="text-[11px] text-muted-foreground">ICU Monitoring</div></div>
    </div>
  );
}

