import { Activity } from "lucide-react";
import { ProcessDashboardClient } from "@/features/processes/components/process-dashboard-client";

export function ProcessDashboard() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Phase 3</p>
          <h1 className="mt-2 text-3xl font-semibold">Process Explorer</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Search processes by PID, name, or user — with live metrics refreshing every second.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Activity className="h-6 w-6 text-accent" />
        </div>
      </header>

      <ProcessDashboardClient />
    </div>
  );
}
