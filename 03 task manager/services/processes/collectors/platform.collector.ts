import "server-only";

import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";
import type { Process, ProcessListSnapshot, ProcessState } from "@/types/process";
import type { ProcessCollector } from "../process.collector";
import {
  estimateStartTime,
  kilobytesToBytes,
  parseEtimeToSeconds,
} from "@/utils/process-metrics";

const execFileAsync = promisify(execFile);
const SAMPLE_INTERVAL_MS = 1_000;

function mapPsState(code: string): ProcessState {
  switch (code.trim().charAt(0)) {
    case "R":
      return "running";
    case "S":
      return "sleeping";
    case "T":
      return "stopped";
    case "Z":
      return "zombie";
    case "I":
      return "idle";
    case "U":
      return "waiting";
    default:
      return "unknown";
  }
}

function isEtimeToken(token: string): boolean {
  return /^(?:\d+-)?\d+:\d+(?::\d+)?$/.test(token);
}

function parseNameAndEtime(tokens: string[], startIndex: number) {
  if (startIndex >= tokens.length) {
    return { etime: "0", name: "unknown" };
  }

  if (isEtimeToken(tokens[startIndex])) {
    return {
      etime: tokens[startIndex],
      name: tokens.slice(startIndex + 1).join(" ") || "unknown",
    };
  }

  const combined = `${tokens[startIndex]}:${tokens[startIndex + 1] ?? ""}`;
  if (isEtimeToken(combined)) {
    return {
      etime: combined,
      name: tokens.slice(startIndex + 2).join(" ") || "unknown",
    };
  }

  return { etime: "0", name: tokens.slice(startIndex).join(" ") || "unknown" };
}

function buildProcess(
  pid: number,
  ppid: number,
  user: string,
  state: string,
  cpuPercent: number,
  rssKb: number,
  vszKb: number,
  threadCount: number,
  etime: string,
  name: string
): Process {
  const uptimeSeconds = parseEtimeToSeconds(etime);

  return {
    pid,
    ppid,
    user,
    state: mapPsState(state),
    name,
    executablePath: null,
    metrics: {
      cpuPercent,
      memoryRssBytes: kilobytesToBytes(rssKb),
      memoryVszBytes: kilobytesToBytes(vszKb),
      threadCount,
      uptimeSeconds,
      startTime: estimateStartTime(uptimeSeconds),
    },
  };
}

function parseDarwinLine(line: string, threadCounts: Map<number, number>): Process | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 8) return null;

  const pid = Number(tokens[0]);
  const ppid = Number(tokens[1]);
  const user = tokens[2];
  const state = tokens[3];
  const cpuPercent = Number(tokens[4]);
  const rssKb = Number(tokens[5]);
  const vszKb = Number(tokens[6]);

  if (
    Number.isNaN(pid) ||
    Number.isNaN(ppid) ||
    Number.isNaN(cpuPercent) ||
    Number.isNaN(rssKb) ||
    Number.isNaN(vszKb)
  ) {
    return null;
  }

  const { etime, name } = parseNameAndEtime(tokens, 7);
  const threadCount = threadCounts.get(pid) ?? 1;

  return buildProcess(
    pid,
    ppid,
    user,
    state,
    cpuPercent,
    rssKb,
    vszKb,
    threadCount,
    etime,
    name
  );
}

function parseLinuxLine(line: string): Process | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 9) return null;

  const pid = Number(tokens[0]);
  const ppid = Number(tokens[1]);
  const user = tokens[2];
  const state = tokens[3];
  const cpuPercent = Number(tokens[4]);
  const rssKb = Number(tokens[5]);
  const vszKb = Number(tokens[6]);
  const threadCount = Number(tokens[7]);

  if (
    Number.isNaN(pid) ||
    Number.isNaN(ppid) ||
    Number.isNaN(cpuPercent) ||
    Number.isNaN(rssKb) ||
    Number.isNaN(vszKb) ||
    Number.isNaN(threadCount)
  ) {
    return null;
  }

  const { etime, name } = parseNameAndEtime(tokens, 8);

  return buildProcess(
    pid,
    ppid,
    user,
    state,
    cpuPercent,
    rssKb,
    vszKb,
    threadCount,
    etime,
    name
  );
}

async function getDarwinThreadCounts(): Promise<Map<number, number>> {
  const { stdout } = await execFileAsync("ps", ["-axM", "-o", "pid="]);
  const counts = new Map<number, number>();

  for (const line of stdout.split("\n")) {
    const pid = Number(line.trim());
    if (!pid) continue;
    counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }

  return counts;
}

async function listDarwinProcesses(): Promise<Process[]> {
  const [psResult, threadCounts] = await Promise.all([
    execFileAsync("ps", [
      "-ax",
      "-o",
      "pid,ppid,user,state,pcpu,rss,vsz,etime,comm",
    ]),
    getDarwinThreadCounts(),
  ]);

  return psResult.stdout
    .split("\n")
    .slice(1)
    .map((line) => parseDarwinLine(line, threadCounts))
    .filter((process): process is Process => process !== null)
    .sort((a, b) => b.metrics.cpuPercent - a.metrics.cpuPercent);
}

async function listLinuxProcesses(): Promise<Process[]> {
  const { stdout } = await execFileAsync("ps", [
    "-ax",
    "-o",
    "pid,ppid,user,state,pcpu,rss,vsz,nlwp,etime,comm",
  ]);

  return stdout
    .split("\n")
    .slice(1)
    .map(parseLinuxLine)
    .filter((process): process is Process => process !== null)
    .sort((a, b) => b.metrics.cpuPercent - a.metrics.cpuPercent);
}

export class DarwinCollector implements ProcessCollector {
  async listProcesses(): Promise<ProcessListSnapshot> {
    const processes = await listDarwinProcesses();

    return {
      timestamp: new Date().toISOString(),
      host: os.hostname(),
      platform: "darwin",
      sampleIntervalMs: SAMPLE_INTERVAL_MS,
      processes,
    };
  }
}

export class LinuxCollector implements ProcessCollector {
  async listProcesses(): Promise<ProcessListSnapshot> {
    const processes = await listLinuxProcesses();

    return {
      timestamp: new Date().toISOString(),
      host: os.hostname(),
      platform: "linux",
      sampleIntervalMs: SAMPLE_INTERVAL_MS,
      processes,
    };
  }
}

export function createProcessCollector(): ProcessCollector {
  if (process.platform === "darwin") {
    return new DarwinCollector();
  }

  if (process.platform === "linux") {
    return new LinuxCollector();
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}
