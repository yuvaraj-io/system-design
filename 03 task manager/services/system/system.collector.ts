import "server-only";

import { execFile } from "node:child_process";
import os from "node:os";
import { statfs } from "node:fs/promises";
import { promisify } from "node:util";
import type { SystemSnapshot } from "@/types/system";

const execFileAsync = promisify(execFile);

function toBytes(value: number) {
  return Math.round(value);
}

function percent(used: number, total: number) {
  if (total === 0) return 0;
  return Number(((used / total) * 100).toFixed(2));
}

function cpuTimes(cpu: os.CpuInfo) {
  return cpu.times;
}

function cpuUsageBetween(start: os.CpuInfo["times"], end: os.CpuInfo["times"]) {
  const idle = end.idle - start.idle;
  const total =
    Object.values(end).reduce((sum, value) => sum + value, 0) -
    Object.values(start).reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;
  return Number((((total - idle) / total) * 100).toFixed(2));
}

async function sampleCpu(sampleMs = 400) {
  const start = os.cpus().map(cpuTimes);
  await new Promise((resolve) => setTimeout(resolve, sampleMs));
  const end = os.cpus().map(cpuTimes);
  const perCore = end.map((endTimes, index) => ({
    core: index,
    utilizationPercent: cpuUsageBetween(start[index], endTimes),
  }));
  const averageUtilizationPercent =
    perCore.length === 0
      ? 0
      : Number(
          (
            perCore.reduce((sum, core) => sum + core.utilizationPercent, 0) / perCore.length
          ).toFixed(2)
        );

  return { averageUtilizationPercent, perCore };
}

async function getSwapInfo() {
  if (process.platform === "linux") {
    try {
      const { stdout } = await execFileAsync("sh", [
        "-c",
        "awk '/SwapTotal:|SwapFree:/ {print $2}' /proc/meminfo",
      ]);
      const [totalKb, freeKb] = stdout.trim().split("\n").map(Number);
      const totalBytes = toBytes(totalKb * 1024);
      const freeBytes = toBytes(freeKb * 1024);
      const usedBytes = totalBytes - freeBytes;
      return {
        totalBytes,
        usedBytes,
        freeBytes,
        utilizationPercent: percent(usedBytes, totalBytes),
      };
    } catch {
      return { totalBytes: 0, usedBytes: 0, freeBytes: 0, utilizationPercent: 0 };
    }
  }

  if (process.platform === "darwin") {
    try {
      const { stdout } = await execFileAsync("sysctl", ["-n", "vm.swapusage"]);
      const match = stdout.match(/total\s*=\s*([\d.]+)M.*used\s*=\s*([\d.]+)M.*free\s*=\s*([\d.]+)M/i);
      if (!match) {
        return { totalBytes: 0, usedBytes: 0, freeBytes: 0, utilizationPercent: 0 };
      }
      const totalBytes = toBytes(Number(match[1]) * 1024 ** 2);
      const usedBytes = toBytes(Number(match[2]) * 1024 ** 2);
      const freeBytes = toBytes(Number(match[3]) * 1024 ** 2);
      return {
        totalBytes,
        usedBytes,
        freeBytes,
        utilizationPercent: percent(usedBytes, totalBytes),
      };
    } catch {
      return { totalBytes: 0, usedBytes: 0, freeBytes: 0, utilizationPercent: 0 };
    }
  }

  return { totalBytes: 0, usedBytes: 0, freeBytes: 0, utilizationPercent: 0 };
}

async function getSystemThreadCount() {
  try {
    if (process.platform === "darwin") {
      const { stdout } = await execFileAsync("sysctl", ["-n", "kern.num_threads"]);
      return Number(stdout.trim());
    }
    if (process.platform === "linux") {
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

export async function getSystemSnapshot(processCount: number): Promise<SystemSnapshot> {
  const [cpu, swap, diskStats, threadCount] = await Promise.all([
    sampleCpu(),
    getSwapInfo(),
    statfs("/"),
    getSystemThreadCount(),
  ]);

  const totalBytes = toBytes(diskStats.blocks * diskStats.bsize);
  const freeBytes = toBytes(diskStats.bavail * diskStats.bsize);
  const usedBytes = totalBytes - freeBytes;
  const totalMem = toBytes(os.totalmem());
  const freeMem = toBytes(os.freemem());
  const usedMem = totalMem - freeMem;
  const loadAverage = os.loadavg() as [number, number, number];

  return {
    timestamp: new Date().toISOString(),
    host: os.hostname(),
    platform: process.platform,
    processCount,
    threadCount,
    cpu: {
      cores: os.cpus().length,
      averageUtilizationPercent: cpu.averageUtilizationPercent,
      loadAverage,
      perCore: cpu.perCore,
    },
    memory: {
      totalBytes: totalMem,
      usedBytes: usedMem,
      freeBytes: freeMem,
      utilizationPercent: percent(usedMem, totalMem),
    },
    swap,
    disk: {
      path: "/",
      totalBytes,
      usedBytes,
      freeBytes,
      utilizationPercent: percent(usedBytes, totalBytes),
    },
    network: {
      bytesIn: null,
      bytesOut: null,
      note: "Per-interface network counters can be added with platform-specific collectors",
    },
  };
}
