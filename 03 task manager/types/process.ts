export type ProcessState =
  | "running"
  | "sleeping"
  | "waiting"
  | "stopped"
  | "zombie"
  | "idle"
  | "unknown";

export interface ProcessMetrics {
  /** Rolling CPU usage percentage for this process */
  cpuPercent: number;
  /** Resident Set Size — physical RAM currently mapped (bytes) */
  memoryRssBytes: number;
  /** Virtual address space size (bytes) */
  memoryVszBytes: number;
  /** Number of OS threads in this process */
  threadCount: number;
  /** Seconds since the process started */
  uptimeSeconds: number;
  /** Estimated process start time (derived from uptime) */
  startTime: string;
}

export interface Process {
  pid: number;
  ppid: number;
  name: string;
  user: string;
  executablePath: string | null;
  state: ProcessState;
  metrics: ProcessMetrics;
}

export interface ProcessListSnapshot {
  timestamp: string;
  host: string;
  platform: NodeJS.Platform;
  sampleIntervalMs: number;
  processes: Process[];
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}
