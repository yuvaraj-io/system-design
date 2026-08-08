"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { ProcessAction } from "@/types/process-actions";

interface ProcessActionsPanelProps {
  pid: number;
  processName: string;
}

interface PendingAction {
  action: ProcessAction;
  label: string;
  description: string;
}

const ACTIONS: PendingAction[] = [
  {
    action: "terminate",
    label: "Terminate",
    description: "Send SIGTERM — allows graceful shutdown.",
  },
  {
    action: "kill",
    label: "Force Kill",
    description: "Send SIGKILL — cannot be caught or ignored.",
  },
  {
    action: "suspend",
    label: "Suspend",
    description: "Send SIGSTOP — pause execution until resumed.",
  },
  {
    action: "resume",
    label: "Resume",
    description: "Send SIGCONT — continue a suspended process.",
  },
];

export function ProcessActionsPanel({ pid, processName }: ProcessActionsPanelProps) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [nice, setNice] = useState(0);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  async function runAction(action: ProcessAction, niceValue?: number) {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/processes/${pid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, nice: niceValue }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Action failed");
      }
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Action failed",
      });
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Process control uses Unix signals. You may need permissions to act on processes owned by
        other users.
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        {ACTIONS.map((item) => (
          <Button
            key={item.action}
            size="small"
            variant={item.action === "kill" ? "contained" : "outlined"}
            color={item.action === "kill" ? "error" : "primary"}
            disabled={busy}
            onClick={() => setPending(item)}
          >
            {item.label}
          </Button>
        ))}
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Change priority (nice value)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Range -20 (highest priority) to 19 (lowest). Default is 0.
        </Typography>
        <Slider
          value={nice}
          min={-20}
          max={19}
          step={1}
          marks={[
            { value: -20, label: "-20" },
            { value: 0, label: "0" },
            { value: 19, label: "19" },
          ]}
          onChange={(_event, value) => setNice(value as number)}
        />
        <Button
          variant="outlined"
          size="small"
          disabled={busy}
          onClick={() => runAction("priority", nice)}
          sx={{ alignSelf: "flex-start" }}
        >
          Set nice to {nice}
        </Button>
      </Stack>

      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      <Dialog open={Boolean(pending)} onClose={() => setPending(null)}>
        <DialogTitle>{pending?.label} process?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{processName}</strong> (PID {pid})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pending?.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Cancel</Button>
          <Button
            color={pending?.action === "kill" ? "error" : "primary"}
            variant="contained"
            disabled={busy}
            onClick={() => pending && runAction(pending.action)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
