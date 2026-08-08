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

export const processThreadSchema = z.object({
  id: z.number(),
  state: z.union([processStateSchema, z.string()]),
  cpuPercent: z.number().nullable(),
  name: z.string(),
});

export const processOpenFileSchema = z.object({
  fd: z.union([z.number(), z.string()]),
  type: z.string(),
  name: z.string(),
});

export const processDetailSchema = processSchema.extend({
  commandLine: z.string().nullable(),
  currentWorkingDirectory: z.string().nullable(),
  environmentVariables: z.record(z.string()),
  threads: z.array(processThreadSchema),
  openFiles: z.array(processOpenFileSchema),
});

export const processActionSchema = z.enum([
  "terminate",
  "kill",
  "suspend",
  "resume",
  "priority",
]);

export const processActionRequestSchema = z.object({
  action: processActionSchema,
  nice: z.number().int().min(-20).max(19).optional(),
});

export const systemSnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  host: z.string(),
  platform: z.enum(["darwin", "linux", "win32", "aix", "freebsd", "openbsd", "sunos"]),
  processCount: z.number().int().nonnegative(),
  threadCount: z.number().int().nonnegative().nullable(),
  cpu: z.object({
    cores: z.number().int().positive(),
    averageUtilizationPercent: z.number(),
    loadAverage: z.tuple([z.number(), z.number(), z.number()]),
    perCore: z.array(
      z.object({
        core: z.number().int().nonnegative(),
        utilizationPercent: z.number(),
      })
    ),
  }),
  memory: z.object({
    totalBytes: z.number().int().nonnegative(),
    usedBytes: z.number().int().nonnegative(),
    freeBytes: z.number().int().nonnegative(),
    utilizationPercent: z.number(),
  }),
  swap: z.object({
    totalBytes: z.number().int().nonnegative(),
    usedBytes: z.number().int().nonnegative(),
    freeBytes: z.number().int().nonnegative(),
    utilizationPercent: z.number(),
  }),
  disk: z.object({
    path: z.string(),
    totalBytes: z.number().int().nonnegative(),
    usedBytes: z.number().int().nonnegative(),
    freeBytes: z.number().int().nonnegative(),
    utilizationPercent: z.number(),
  }),
  network: z.object({
    bytesIn: z.number().nullable(),
    bytesOut: z.number().nullable(),
    note: z.string().nullable(),
  }),
});
