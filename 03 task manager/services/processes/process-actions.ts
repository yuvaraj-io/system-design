import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ProcessAction } from "@/types/process-actions";

const execFileAsync = promisify(execFile);

export interface ProcessActionResult {
  pid: number;
  action: ProcessAction;
  success: boolean;
  message: string;
}

function signalForAction(action: Exclude<ProcessAction, "priority">): NodeJS.Signals {
  switch (action) {
    case "terminate":
      return "SIGTERM";
    case "kill":
      return "SIGKILL";
    case "suspend":
      return "SIGSTOP";
    case "resume":
      return "SIGCONT";
  }
}

async function processExists(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function runProcessAction(
  pid: number,
  action: ProcessAction,
  options?: { nice?: number }
): Promise<ProcessActionResult> {
  if (!Number.isInteger(pid) || pid <= 0) {
    return { pid, action, success: false, message: "Invalid PID" };
  }

  if (pid === process.pid) {
    return { pid, action, success: false, message: "Refusing to act on the API server process" };
  }

  const exists = await processExists(pid);
  if (!exists) {
    return { pid, action, success: false, message: `Process ${pid} not found` };
  }

  try {
    if (action === "priority") {
      const nice = options?.nice;
      if (nice == null || nice < -20 || nice > 19) {
        return { pid, action, success: false, message: "Nice value must be between -20 and 19" };
      }

      if (process.platform === "win32") {
        return { pid, action, success: false, message: "Priority changes are not supported on Windows" };
      }

      await execFileAsync("renice", [String(nice), "-p", String(pid)]);
      return { pid, action, success: true, message: `Priority set to nice ${nice}` };
    }

    const signal = signalForAction(action);
    process.kill(pid, signal);
    return { pid, action, success: true, message: `Sent ${signal} to PID ${pid}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return { pid, action, success: false, message };
  }
}
