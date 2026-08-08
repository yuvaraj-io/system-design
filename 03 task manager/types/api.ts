import { z } from "zod";

export const processStateSchema = z.enum([
  "running",
  "sleeping",
  "waiting",
  "stopped",
  "zombie",
  "idle",
  "unknown",
]);

export const processMetricsSchema = z.object({
  cpuPercent: z.number().min(0),
  memoryRssBytes: z.number().int().nonnegative(),
  memoryVszBytes: z.number().int().nonnegative(),
  threadCount: z.number().int().nonnegative(),
  uptimeSeconds: z.number().int().nonnegative(),
  startTime: z.string().datetime(),
});

export const processSchema = z.object({
  pid: z.number().int().positive(),
  ppid: z.number().int().nonnegative(),
  name: z.string(),
  user: z.string(),
  executablePath: z.string().nullable(),
  state: processStateSchema,
  metrics: processMetricsSchema,
});

export const processListSnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  host: z.string(),
  platform: z.enum(["darwin", "linux", "win32", "aix", "freebsd", "openbsd", "sunos"]),
  currentUser: z.string(),
  sampleIntervalMs: z.number().int().positive(),
  processes: z.array(processSchema),
});
