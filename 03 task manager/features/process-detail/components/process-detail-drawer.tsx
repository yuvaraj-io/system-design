"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { StateBadge } from "@/features/processes/components/state-badge";
import { useUiStore } from "@/store/ui.store";
import type { Process } from "@/types/process";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatUptime,
} from "@/utils/format";

const breakableTextSx = {
  wordBreak: "break-word",
  overflowWrap: "anywhere",
} as const;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 120px) minmax(0, 1fr)",
        columnGap: 2,
        rowGap: 0.25,
        py: 0.75,
        alignItems: "start",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, ...breakableTextSx }}>
        {value}
      </Typography>
    </Box>
  );
}

interface ProcessDetailDrawerProps {
  processes: Process[];
}

export function ProcessDetailDrawer({ processes }: ProcessDetailDrawerProps) {
  const selectedPid = useUiStore((state) => state.selectedPid);
  const detailOpen = useUiStore((state) => state.detailOpen);
  const setDetailOpen = useUiStore((state) => state.setDetailOpen);

  const process = processes.find((item) => item.pid === selectedPid) ?? null;

  return (
    <Drawer
      anchor="right"
      open={detailOpen && Boolean(process)}
      onClose={() => setDetailOpen(false)}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 440 },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
      }}
    >
      {process && (
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 3,
            boxSizing: "border-box",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" color="primary">
                Phase 7 · Process Details
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mt: 0.5,
                  lineHeight: 1.35,
                  ...breakableTextSx,
                }}
              >
                {process.name}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ mt: 1, alignItems: "center", flexWrap: "wrap" }}
              >
                <Typography variant="body2" color="text.secondary">
                  PID {formatNumber(process.pid)}
                </Typography>
                <StateBadge state={process.state} />
              </Stack>
            </Box>
            <IconButton
              aria-label="Close details"
              onClick={() => setDetailOpen(false)}
              sx={{ flexShrink: 0, mt: -0.5 }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            General
          </Typography>
          <DetailRow label="Parent PID" value={formatNumber(process.ppid)} />
          <DetailRow label="User" value={process.user} />
          <DetailRow label="Executable path" value={process.executablePath ?? "—"} />
          <DetailRow label="Start time" value={formatDateTime(process.metrics.startTime)} />
          <DetailRow label="Uptime" value={formatUptime(process.metrics.uptimeSeconds)} />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Performance
          </Typography>
          <DetailRow label="CPU" value={formatPercent(process.metrics.cpuPercent)} />
          <DetailRow label="Memory (RSS)" value={formatBytes(process.metrics.memoryRssBytes)} />
          <DetailRow label="Virtual memory" value={formatBytes(process.metrics.memoryVszBytes)} />
          <DetailRow label="Threads" value={formatNumber(process.metrics.threadCount)} />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Coming next
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={breakableTextSx}>
            Environment variables, command line, open files, and per-thread breakdown will be added
            in the next Phase 7 steps via platform-specific collectors.
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}
