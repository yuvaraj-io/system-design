import os from "node:os";
import { statfs } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function bytesToGB(bytes) {
  return Number((bytes / 1024 ** 3).toFixed(2));
}

function percent(used, total) {
  if (total === 0) return 0;
  return Number(((used / total) * 100).toFixed(2));
}

export function getCoreCount() {
  return os.cpus().length;
}

export function getMemoryInfo() {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;

  return {
    totalBytes,
    usedBytes,
    freeBytes,
    totalGB: bytesToGB(totalBytes),
    usedGB: bytesToGB(usedBytes),
    freeGB: bytesToGB(freeBytes),
    utilizationPercent: percent(usedBytes, totalBytes),
  };
}

export async function getDiskInfo(path = "/") {
  const stats = await statfs(path);
  const blockSize = stats.bsize;
  const totalBytes = stats.blocks * blockSize;
  const freeBytes = stats.bavail * blockSize;
  const usedBytes = totalBytes - freeBytes;

  return {
    path,
    totalBytes,
    usedBytes,
    freeBytes,
    totalGB: bytesToGB(totalBytes),
    usedGB: bytesToGB(usedBytes),
    freeGB: bytesToGB(freeBytes),
    utilizationPercent: percent(usedBytes, totalBytes),
  };
}

function cpuTimes(cpu) {
  return cpu.times;
}

function cpuUsageBetween(start, end) {
  const idle = end.idle - start.idle;
  const total =
    Object.values(end).reduce((sum, value) => sum + value, 0) -
    Object.values(start).reduce((sum, value) => sum + value, 0);

  if (total === 0) return 0;
  return Number((((total - idle) / total) * 100).toFixed(2));
}

export function getCpuUtilization(sampleMs = 500) {
  const start = os.cpus().map(cpuTimes);

  return new Promise((resolve) => {
    setTimeout(() => {
      const end = os.cpus().map(cpuTimes);
      const perCore = end.map((endTimes, index) => ({
        core: index,
        utilizationPercent: cpuUsageBetween(start[index], endTimes),
      }));

      const averageUtilization =
        perCore.length === 0
          ? 0
          : Number(
              (
                perCore.reduce((sum, core) => sum + core.utilizationPercent, 0) /
                perCore.length
              ).toFixed(2)
            );

      resolve({
        averageUtilizationPercent: averageUtilization,
        perCore,
      });
    }, sampleMs);
  });
}

async function getSystemThreadCount() {
  const platform = process.platform;

  try {
    if (platform === "darwin") {
      const { stdout } = await execFileAsync("sysctl", ["-n", "kern.num_threads"]);
      return Number(stdout.trim());
    }

    if (platform === "linux") {
      const { stdout } = await execFileAsync("sh", [
        "-c",
        "ls /proc/*/task 2>/dev/null | wc -l",
      ]);
      return Number(stdout.trim());
    }

    return null;
  } catch {
    return null;
  }
}

function createEmptyThreadStates() {
  return {
    running: 0,
    sleeping: 0,
    waiting: 0,
    stopped: 0,
    zombie: 0,
    idle: 0,
    other: 0,
    total: 0,
  };
}

function bumpThreadState(states, code) {
  switch (code) {
    case "R":
      states.running += 1;
      break;
    case "S":
      states.sleeping += 1;
      break;
    case "D":
      states.waiting += 1;
      break;
    case "T":
      states.stopped += 1;
      break;
    case "Z":
      states.zombie += 1;
      break;
    case "I":
      states.idle += 1;
      break;
    default:
      states.other += 1;
      break;
  }

  states.total += 1;
}

function parseThreadStatesFromPsM(stdout) {
  const states = createEmptyThreadStates();
  const lines = stdout.trim().split("\n").slice(1);

  for (const line of lines) {
    const match = line.match(/([0-9]+\.[0-9]+)\s+([RISZT])\s/);
    if (match) {
      bumpThreadState(states, match[2]);
    }
  }

  return states;
}

async function getLinuxThreadStatesFromProc() {
  const states = createEmptyThreadStates();

  try {
    const { stdout } = await execFileAsync("sh", [
      "-c",
      "for f in /proc/[0-9]*/task/*/stat; do awk '{print $3}' \"$f\" 2>/dev/null; done",
    ]);

    for (const code of stdout.trim().split("\n")) {
      if (!code) continue;
      bumpThreadState(states, code.charAt(0));
    }
  } catch {
    return null;
  }

  return states;
}

async function getSystemThreadStates() {
  if (process.platform === "linux") {
    return getLinuxThreadStatesFromProc();
  }

  if (process.platform === "darwin") {
    try {
      const { stdout } = await execFileAsync("ps", ["-axM"]);
      return parseThreadStatesFromPsM(stdout);
    } catch {
      return null;
    }
  }

  return null;
}

async function getProcessThreadStates(pid = process.pid) {
  try {
    if (process.platform === "darwin" || process.platform === "linux") {
      const { stdout } = await execFileAsync("ps", ["-M", String(pid)]);
      return parseThreadStatesFromPsM(stdout);
    }

    return null;
  } catch {
    return null;
  }
}

async function getThreadLimits() {
  const cpuCores = getCoreCount();

  if (process.platform === "linux") {
    try {
      const { stdout } = await execFileAsync("cat", ["/proc/sys/kernel/threads-max"]);
      const maxThreads = Number(stdout.trim());
      return {
        cpuCores,
        maxThreads: Number.isFinite(maxThreads) ? maxThreads : null,
        maxProcesses: null,
        note: "Linux kernel thread ceiling",
      };
    } catch {
      return { cpuCores, maxThreads: null, maxProcesses: null, note: null };
    }
  }

  if (process.platform === "darwin") {
    try {
      const { stdout } = await execFileAsync("sysctl", ["-n", "kern.maxproc"]);
      const maxProcesses = Number(stdout.trim());
      return {
        cpuCores,
        maxThreads: null,
        maxProcesses: Number.isFinite(maxProcesses) ? maxProcesses : null,
        note: "macOS has no single system-wide thread pool; threads are created per process",
      };
    } catch {
      return { cpuCores, maxThreads: null, maxProcesses: null, note: null };
    }
  }

  return { cpuCores, maxThreads: null, maxProcesses: null, note: null };
}

async function getProcessThreadCount() {
  try {
    if (process.platform === "darwin" || process.platform === "linux") {
      const { stdout } = await execFileAsync("ps", ["-M", String(process.pid)]);
      const lines = stdout.trim().split("\n").filter(Boolean);
      return Math.max(0, lines.length - 1);
    }

    return null;
  } catch {
    return null;
  }
}

export async function getThreadInfo() {
  const [
    systemThreadCount,
    processThreadCount,
    systemStates,
    processStates,
    limits,
    activeHandles,
  ] = await Promise.all([
    getSystemThreadCount(),
    getProcessThreadCount(),
    getSystemThreadStates(),
    getProcessThreadStates(),
    getThreadLimits(),
    Promise.resolve(process._getActiveHandles?.().length ?? null),
  ]);

  const sampledSystemStates = systemStates?.total ?? 0;
  const hiddenSystemThreads =
    systemThreadCount != null && sampledSystemStates > 0
      ? Math.max(0, systemThreadCount - sampledSystemStates)
      : null;

  const maxThreads = limits.maxThreads;
  const availableThreads =
    maxThreads != null && systemThreadCount != null
      ? Math.max(0, maxThreads - systemThreadCount)
      : null;

  return {
    systemThreadCount,
    processThreadCount,
    systemStates,
    processStates,
    hiddenSystemThreads,
    limits: {
      ...limits,
      availableThreads,
    },
    nodeProcessActiveHandles: activeHandles,
    nodeProcessActiveRequests: process._getActiveRequests?.().length ?? null,
  };
}
