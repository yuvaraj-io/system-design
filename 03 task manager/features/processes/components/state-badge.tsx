import { cn } from "@/utils/cn";
import type { ProcessState } from "@/types/process";

const stateStyles: Record<ProcessState, string> = {
  running: "bg-emerald-500/15 text-emerald-300",
  sleeping: "bg-sky-500/15 text-sky-300",
  waiting: "bg-amber-500/15 text-amber-300",
  stopped: "bg-rose-500/15 text-rose-300",
  zombie: "bg-fuchsia-500/15 text-fuchsia-300",
  idle: "bg-slate-500/15 text-slate-300",
  unknown: "bg-slate-500/15 text-slate-300",
};

export function StateBadge({ state }: { state: ProcessState }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        stateStyles[state]
      )}
    >
      {state}
    </span>
  );
}
