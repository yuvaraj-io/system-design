"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSystemQuery } from "@/features/system/hooks/use-system-query";
import { formatBytes, formatNumber, formatPercent } from "@/utils/format";

function MetricCard({
  title,
  value,
  subtitle,
  percent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  percent?: number;
}) {
  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
        {value}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
      {percent != null ? (
        <LinearProgress variant="determinate" value={Math.min(100, percent)} sx={{ mt: 1.5, height: 8, borderRadius: 1 }} />
      ) : null}
    </Paper>
  );
}

export function SystemDashboard() {
  const { data, isLoading, isError, error } = useSystemQuery();

  if (isLoading) {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", p: 3 }}>
        <CircularProgress size={22} />
        <Typography color="text.secondary">Loading system metrics…</Typography>
      </Stack>
    );
  }

  if (isError || !data) {
    return (
      <Typography color="error">
        {error instanceof Error ? error.message : "Failed to load system metrics"}
      </Typography>
    );
  }

  const coreChartData = data.cpu.perCore.map((core) => ({
    name: `C${core.core + 1}`,
    cpu: core.utilizationPercent,
  }));

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Chip label={`Host: ${data.host}`} variant="outlined" />
        <Chip label={`Platform: ${data.platform}`} variant="outlined" />
        <Chip label={`Processes: ${formatNumber(data.processCount)}`} variant="outlined" />
        <Chip
          label={`Threads: ${data.threadCount == null ? "N/A" : formatNumber(data.threadCount)}`}
          variant="outlined"
        />
        <Chip
          label={`Load: ${data.cpu.loadAverage.map((v) => v.toFixed(2)).join(" · ")}`}
          variant="outlined"
        />
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <MetricCard
            title="CPU"
            value={formatPercent(data.cpu.averageUtilizationPercent)}
            subtitle={`${data.cpu.cores} cores`}
            percent={data.cpu.averageUtilizationPercent}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <MetricCard
            title="Memory"
            value={formatBytes(data.memory.usedBytes)}
            subtitle={`${formatPercent(data.memory.utilizationPercent)} of ${formatBytes(data.memory.totalBytes)}`}
            percent={data.memory.utilizationPercent}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <MetricCard
            title="Swap"
            value={formatBytes(data.swap.usedBytes)}
            subtitle={`${formatPercent(data.swap.utilizationPercent)} of ${formatBytes(data.swap.totalBytes)}`}
            percent={data.swap.utilizationPercent}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <MetricCard
            title="Disk"
            value={formatBytes(data.disk.usedBytes)}
            subtitle={`${formatPercent(data.disk.utilizationPercent)} used · ${formatBytes(data.disk.freeBytes)} free`}
            percent={data.disk.utilizationPercent}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Per-core CPU utilization
        </Typography>
        <Box sx={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={coreChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, "CPU"]} />
              <Bar dataKey="cpu" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {data.network.note ? (
        <Typography variant="body2" color="text.secondary">
          {data.network.note}
        </Typography>
      ) : null}
    </Stack>
  );
}
