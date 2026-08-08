import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ProcessListSnapshot } from "@/types/process";
import { getSystemSnapshot } from "@/services/system/system.collector";
import { createProcessCollector } from "./collectors/platform.collector";
import { getProcessDetail as collectProcessDetail } from "./collectors/process-detail.collector";
import { runProcessAction } from "./process-actions";

const execFileAsync = promisify(execFile);
const collector = createProcessCollector();

async function getProcessCount(): Promise<number> {
  try {
    const { stdout } = await execFileAsync("ps", ["-ax"]);
    return Math.max(0, stdout.trim().split("\n").length - 1);
  } catch {
    const snapshot = await collector.listProcesses();
    return snapshot.processes.length;
  }
}

export async function getProcessListSnapshot(): Promise<ProcessListSnapshot> {
  return collector.listProcesses();
}

export async function getProcessDetailByPid(pid: number) {
  const snapshot = await getProcessListSnapshot();
  const process = snapshot.processes.find((item) => item.pid === pid);
  if (!process) return null;
  return collectProcessDetail(process);
}

export async function getSystemMetrics() {
  const processCount = await getProcessCount();
  return getSystemSnapshot(processCount);
}

export { runProcessAction };
