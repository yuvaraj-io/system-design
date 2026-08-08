"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { ProcessActionsPanel } from "@/features/process-detail/components/process-actions-panel";
import { ProcessHistoryChart } from "@/features/process-detail/components/process-history-chart";
import { useProcessDetail } from "@/features/process-detail/hooks/use-process-detail";
import { useProcessMetricsHistory } from "@/features/process-detail/hooks/use-process-metrics-history";
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
        gridTemplateColumns: "minmax(0, 120px) 1fr",
        columnGap: 2,
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
  const [tab, setTab] = useState(0);

  const summary = processes.find((item) => item.pid === selectedPid) ?? null;
  const { data: detail, isLoading, isError, error } = useProcessDetail(
    selectedPid,
    detailOpen && selectedPid != null
  );
  const history = useProcessMetricsHistory(selectedPid, processes, detailOpen);

  const process = detail ?? summary;

  return (
    <Drawer
      anchor="right"
      open={detailOpen && Boolean(process)}
      onClose={() => setDetailOpen(false)}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 480 },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
      }}
    >
      {process && (
        <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: 3 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" color="primary">
                Phase 7–8 · Process Details
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.35, ...breakableTextSx }}>
                {process.name}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="body2" color="text.secondary">
                  PID {formatNumber(process.pid)}
                </Typography>
                <StateBadge state={process.state} />
              </Stack>
            </Box>
            <IconButton aria-label="Close details" onClick={() => setDetailOpen(false)} sx={{ flexShrink: 0 }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Tabs value={tab} onChange={(_e, value) => setTab(value)} sx={{ mt: 2 }} variant="scrollable">
            <Tab label="General" />
            <Tab label="Performance" />
            <Tab label="Threads" />
            <Tab label="Files" />
            <Tab label="Environment" />
            <Tab label="Actions" />
          </Tabs>

          <Divider sx={{ my: 2 }} />

          {isLoading && tab > 0 ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", py: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading deep process data…
              </Typography>
            </Stack>
          ) : null}

          {isError && tab > 0 ? (
            <Typography variant="body2" color="error" sx={{ py: 1 }}>
              {error instanceof Error ? error.message : "Failed to load details"}
            </Typography>
          ) : null}

          {tab === 0 && (
            <Box>
              <DetailRow label="Parent PID" value={formatNumber(process.ppid)} />
              <DetailRow label="User" value={process.user} />
              <DetailRow label="Executable path" value={detail?.executablePath ?? process.executablePath ?? "—"} />
              <DetailRow label="Command line" value={detail?.commandLine ?? "—"} />
              <DetailRow label="Working directory" value={detail?.currentWorkingDirectory ?? "—"} />
              <DetailRow label="Start time" value={formatDateTime(process.metrics.startTime)} />
              <DetailRow label="Uptime" value={formatUptime(process.metrics.uptimeSeconds)} />
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <DetailRow label="CPU" value={formatPercent(process.metrics.cpuPercent)} />
              <DetailRow label="Memory (RSS)" value={formatBytes(process.metrics.memoryRssBytes)} />
              <DetailRow label="Virtual memory" value={formatBytes(process.metrics.memoryVszBytes)} />
              <DetailRow label="Threads" value={formatNumber(process.metrics.threadCount)} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                CPU & memory history
              </Typography>
              <ProcessHistoryChart history={history} />
            </Box>
          )}

          {tab === 2 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>CPU %</TableCell>
                  <TableCell>Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(detail?.threads ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary">
                        No thread data available.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  detail?.threads.map((thread) => (
                    <TableRow key={thread.id}>
                      <TableCell>{thread.id}</TableCell>
                      <TableCell>{String(thread.state)}</TableCell>
                      <TableCell>{thread.cpuPercent == null ? "—" : formatPercent(thread.cpuPercent)}</TableCell>
                      <TableCell sx={breakableTextSx}>{thread.name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {tab === 3 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>FD</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Path</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(detail?.openFiles ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary">
                        No open files listed (may require permissions).
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  detail?.openFiles.map((file, index) => (
                    <TableRow key={`${file.fd}-${index}`}>
                      <TableCell>{String(file.fd)}</TableCell>
                      <TableCell>{file.type}</TableCell>
                      <TableCell sx={breakableTextSx}>{file.name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {tab === 4 && (
            <Box>
              {detail && Object.keys(detail.environmentVariables).length > 0 ? (
                Object.entries(detail.environmentVariables)
                  .slice(0, 100)
                  .map(([key, value]) => <DetailRow key={key} label={key} value={value} />)
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Environment variables are fully available on Linux via /proc. On macOS, only limited
                  data is exposed without elevated permissions.
                </Typography>
              )}
            </Box>
          )}

          {tab === 5 && <ProcessActionsPanel pid={process.pid} processName={process.name} />}
        </Box>
      )}
    </Drawer>
  );
}
