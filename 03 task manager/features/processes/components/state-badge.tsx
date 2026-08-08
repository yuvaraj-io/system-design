import { Chip } from "@mui/material";
import type { ProcessState } from "@/types/process";

const stateColor: Record<
  ProcessState,
  "success" | "info" | "warning" | "error" | "default" | "secondary"
> = {
  running: "success",
  sleeping: "info",
  waiting: "warning",
  stopped: "error",
  zombie: "secondary",
  idle: "default",
  unknown: "default",
};

export function StateBadge({ state }: { state: ProcessState }) {
  return <Chip size="small" label={state} color={stateColor[state]} variant="outlined" />;
}
