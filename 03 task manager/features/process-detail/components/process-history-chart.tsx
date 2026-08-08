"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricsHistoryPoint } from "@/features/process-detail/hooks/use-process-metrics-history";
import { formatBytes } from "@/utils/format";

interface ProcessHistoryChartProps {
  history: MetricsHistoryPoint[];
}

export function ProcessHistoryChart({ history }: ProcessHistoryChartProps) {
  if (history.length < 2) {
    return (
      <Typography variant="body2" color="text.secondary">
        Collecting samples… history appears after a few refresh cycles.
      </Typography>
    );
  }

  const chartData = history.map((point, index) => ({
    index,
    cpu: point.cpuPercent,
    memoryMb: Number((point.memoryRssBytes / 1024 ** 2).toFixed(1)),
    label: new Date(point.timestamp).toLocaleTimeString(),
  }));

  return (
    <Box sx={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" hide />
          <YAxis yAxisId="cpu" orientation="left" width={40} />
          <YAxis yAxisId="mem" orientation="right" width={48} />
          <Tooltip
            formatter={(value, name) =>
              name === "memoryMb" ? [`${value} MB`, "Memory"] : [`${value}%`, "CPU"]
            }
          />
          <Legend />
          <Line
            yAxisId="cpu"
            type="monotone"
            dataKey="cpu"
            name="CPU %"
            stroke="#2563eb"
            dot={false}
            strokeWidth={2}
          />
          <Line
            yAxisId="mem"
            type="monotone"
            dataKey="memoryMb"
            name="Memory (MB)"
            stroke="#16a34a"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      <Typography variant="caption" color="text.secondary">
        Last sample memory: {formatBytes(history[history.length - 1]?.memoryRssBytes ?? 0)}
      </Typography>
    </Box>
  );
}
