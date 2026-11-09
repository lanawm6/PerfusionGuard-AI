import { useState } from "react";
import { Eye, Check, CheckCheck } from "lucide-react";
import { useDemo, type ClinicalAlert, type AlertStatus } from "@/lib/clinical/demo-context";
import { fmtDateTime } from "@/lib/clinical/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RiskBadge } from "./widgets";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<AlertStatus, string> = {
  Active: "bg-risk-high-soft text-risk-high",
  Acknowledged: "bg-risk-moderate-soft text-risk-moderate",
  Reviewed: "bg-muted text-muted-foreground",
};

export function AlertsTable({ limit }: { limit?: number }) {
  const { alerts, setAlertStatus } = useDemo();
  const [openId, setOpenId] = useState<string | null>(null);
  const list = limit ? alerts.slice(0, limit) : alerts;
  const open = alerts.find((a) => a.id === openId);

  if (list.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No alerts for this patient.</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Severity</th><th className="py-2 pr-3 font-medium">Type</th><th className="py-2 pr-3 font-medium">Patient</th>
            <th className="py-2 pr-3 font-medium">Time</th><th className="py-2 pr-3 font-medium">Contributing findings</th><th className="py-2 pr-3 font-medium">Status</th><th className="py-2 text-right font-medium">Actions</th>
          </tr></thead>
          <tbody>{list.map((a) => (
            <tr key={a.id} className="border-b border-border align-top last:border-0">
              <td className="py-2.5 pr-3"><RiskBadge level={a.severity} /></td>
              <td className="py-2.5 pr-3">{a.type}</td>
              <td className="py-2.5 pr-3 font-mono text-xs">{a.patientId}</td>
              <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap">{fmtDateTime(a.t)}</td>
              <td className="max-w-xs py-2.5 pr-3 text-xs text-muted-foreground">{a.findings.slice(0, 2).join("; ")}{a.findings.length > 2 && ` +${a.findings.length - 2} more`}</td>
              <td className="py-2.5 pr-3"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_STYLE[a.status])}>{a.status}</span></td>
              <td className="py-2.5"><AlertActions a={a} onView={() => setOpenId(a.id)} set={setAlertStatus} /></td>
            </tr>))}</tbody>
        </table>
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        {open && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><RiskBadge level={open.severity} />{open.type} alert · {open.patientId}</DialogTitle>
              <DialogDescription>{fmtDateTime(open.t)} · Status: {open.status}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div><h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contributing findings</h3>
                <ul className="list-disc space-y-0.5 pl-5">{open.findings.map((f) => <li key={f}>{f}</li>)}</ul></div>
              <div className="rounded-md border border-primary/30 bg-accent p-3 text-accent-foreground"><strong>Recommendation:</strong> {open.recommendation}</div>
            </div>
            <div className="flex justify-end gap-2"><AlertActions a={open} set={setAlertStatus} /></div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function AlertActions({ a, onView, set }: { a: ClinicalAlert & { status: AlertStatus }; onView?: () => void; set: (id: string, s: AlertStatus) => void }) {
  return (
    <div className="flex justify-end gap-1.5">
      {onView && <Button size="sm" variant="outline" onClick={onView}><Eye className="h-3.5 w-3.5" />Details</Button>}
      <Button size="sm" variant="outline" disabled={a.status !== "Active"} onClick={() => set(a.id, "Acknowledged")}><Check className="h-3.5 w-3.5" />Acknowledge</Button>
      <Button size="sm" disabled={a.status === "Reviewed"} onClick={() => set(a.id, "Reviewed")}><CheckCheck className="h-3.5 w-3.5" />Reviewed</Button>
    </div>
  );
}
