import type { Process, ProcessState } from "@/types/process";

export interface ProcessThreadInfo {
  id: number;
  state: ProcessState | string;
  cpuPercent: number | null;
  name: string;
}

export interface ProcessOpenFile {
  fd: number | string;
  type: string;
  name: string;
}

export interface ProcessDetail extends Process {
  commandLine: string | null;
  currentWorkingDirectory: string | null;
  environmentVariables: Record<string, string>;
  threads: ProcessThreadInfo[];
  openFiles: ProcessOpenFile[];
}
