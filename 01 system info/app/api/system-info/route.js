import os from "node:os";
import {
  getCoreCount,
  getCpuUtilization,
  getDiskInfo,
  getMemoryInfo,
  getThreadInfo,
} from "@/lib/collectors";

export const runtime = "nodejs";

export async function GET() {
  try {
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to collect system info",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
