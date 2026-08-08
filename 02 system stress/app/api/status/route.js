import os from "node:os";
import {
  getCoreCount,
  getCpuUtilization,
  getDiskInfo,
  getMemoryInfo,
  getThreadInfo,
} from "@/lib/collectors";
import { stressManager } from "@/lib/stress-manager";

export const runtime = "nodejs";

export async function GET() {
  const [cpu, disk, threads] = await Promise.all([
    getCpuUtilization(),
    getDiskInfo(),
    getThreadInfo(),
  ]);

  return Response.json({
    hostname: os.hostname(),
    platform: process.platform,
    cores: getCoreCount(),
    memory: getMemoryInfo(),
    disk,
    cpu,
    threads,
    stress: stressManager.getStatus(),
    timestamp: new Date().toISOString(),
  });
}
