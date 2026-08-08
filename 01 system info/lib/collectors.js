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

export async function getThreadInfo() {
  const [systemThreadCount, activeHandles] = await Promise.all([
    getSystemThreadCount(),
    Promise.resolve(process._getActiveHandles?.().length ?? null),
  ]);

  return {
    systemThreadCount,
    nodeProcessActiveHandles: activeHandles,
    nodeProcessActiveRequests: process._getActiveRequests?.().length ?? null,
  };
}
