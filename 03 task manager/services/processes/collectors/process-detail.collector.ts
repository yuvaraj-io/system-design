import "server-only";

import { readFile } from "node:fs/promises";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import type { Process, ProcessState } from "@/types/process";
import type {
  ProcessDetail,
  ProcessOpenFile,
  ProcessThreadInfo,
} from "@/types/process-detail";

const execFileAsync = promisify(execFileCb);

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

async function readLinuxEnviron(pid: number): Promise<Record<string, string>> {
  try {
    const raw = await readFile(`/proc/${pid}/environ`, "utf8");
    const env: Record<string, string> = {};
    for (const part of raw.split("\0")) {
      if (!part) continue;
      const index = part.indexOf("=");
      if (index === -1) continue;
      env[part.slice(0, index)] = part.slice(index + 1);
    }
    return env;
  } catch {
    return {};
  }
}

async function readLinuxCmdline(pid: number): Promise<string | null> {
  try {
    const raw = await readFile(`/proc/${pid}/cmdline`, "utf8");
    const command = raw.replace(/\0/g, " ").trim();
    return command || null;
  } catch {
    return null;
  }
}

export async function getProcessDetail(proc: Process): Promise<ProcessDetail> {
  const pid = proc.pid;

  if (globalThis.process.platform === "linux") {
    const [commandLine, currentWorkingDirectory, executablePath, environmentVariables, threads, openFiles] =
      await Promise.all([
        readLinuxCmdline(pid),
        readLinuxCwd(pid),
        readLinuxExe(pid),
        readLinuxEnviron(pid),
        listLinuxThreads(pid),
        listLinuxOpenFiles(pid),
      ]);

    return {
      ...proc,
      executablePath: executablePath ?? proc.executablePath,
      commandLine,
      currentWorkingDirectory,
      environmentVariables,
      threads,
      openFiles,
    };
  }

  const [commandLine, currentWorkingDirectory, executablePath, environmentVariables, threads, openFiles] =
    await Promise.all([
      getDarwinCommandLine(pid),
      getDarwinCwd(pid),
      getDarwinExecutablePath(pid),
      getDarwinEnvironment(pid),
      listDarwinThreads(pid),
      listDarwinOpenFiles(pid),
    ]);

  return {
    ...proc,
    executablePath: executablePath ?? proc.executablePath,
    commandLine,
    currentWorkingDirectory,
    environmentVariables,
    threads,
    openFiles,
  };
}

async function readLinuxExe(pid: number): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("readlink", [`/proc/${pid}/exe`]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function listLinuxThreads(pid: number): Promise<ProcessThreadInfo[]> {
  try {
    const { stdout } = await execFileAsync("ps", [
      "-L",
      "-p",
      String(pid),
      "-o",
      "lwp,state,pcpu,comm",
    ]);
    return stdout
      .trim()
      .split("\n")
      .slice(1)
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 4) return null;
        const thread: ProcessThreadInfo = {
          id: Number(parts[0]),
          state: mapPsState(parts[1]),
          cpuPercent: Number(parts[2]),
          name: parts.slice(3).join(" "),
        };
        return Number.isNaN(thread.id) ? null : thread;
      })
      .filter((thread): thread is ProcessThreadInfo => thread !== null);
  } catch {
    return [];
  }
}

async function listLinuxOpenFiles(pid: number): Promise<ProcessOpenFile[]> {
  try {
    const { stdout } = await execFileAsync("sh", [
      "-c",
      `ls -l /proc/${pid}/fd 2>/dev/null | tail -n +2 | head -80`,
    ]);
    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^l?\S+\s+\S+\s+\S+\s+\S+\s+(\S+)\s+(\d+)\s+(.*)$/);
        if (!match) {
          const fdMatch = line.match(/\s+(\d+)\s+->\s+(.*)$/);
          if (!fdMatch) return null;
          const file: ProcessOpenFile = {
            fd: Number(fdMatch[1]),
            type: line.startsWith("l") ? "link" : "file",
            name: fdMatch[2],
          };
          return file;
        }
        const file: ProcessOpenFile = {
          fd: Number(match[2]),
          type: line.startsWith("l") ? "link" : "file",
          name: match[3],
        };
        return file;
      })
      .filter((file): file is ProcessOpenFile => file !== null);
  } catch {
    return [];
  }
}

async function getDarwinCommandLine(pid: number): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("ps", ["-p", String(pid), "-ww", "-o", "command="]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function getDarwinCwd(pid: number): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"]);
    const nameLine = stdout.split("\n").find((line) => line.startsWith("n"));
    return nameLine ? nameLine.slice(1) : null;
  } catch {
    return null;
  }
}

async function getDarwinExecutablePath(pid: number): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("lsof", ["-p", String(pid)]);
    const textLine = stdout
      .split("\n")
      .find((line) => line.includes(" txt ") || line.endsWith(" txt"));
    if (!textLine) return null;
    const parts = textLine.trim().split(/\s+/);
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

async function listDarwinThreads(pid: number): Promise<ProcessThreadInfo[]> {
  try {
    const { stdout } = await execFileAsync("ps", ["-M", String(pid)]);
    return stdout
      .trim()
      .split("\n")
      .slice(1)
      .map((line, index) => {
        const match = line.match(/([0-9]+\.[0-9]+)\s+([RISZT])\s/);
        const name = line.trim().split(/\s+/).slice(-1)[0] ?? `thread-${index}`;
        return {
          id: index + 1,
          state: match ? mapPsState(match[2]) : "unknown",
          cpuPercent: match ? Number(match[1]) : null,
          name,
        };
      });
  } catch {
    return [];
  }
}

async function listDarwinOpenFiles(pid: number): Promise<ProcessOpenFile[]> {
  try {
    const { stdout } = await execFileAsync("lsof", ["-p", String(pid), "-Fn"]);
    const files: ProcessOpenFile[] = [];
    let currentFd: string | number = "?";
    let currentName = "";

    for (const line of stdout.split("\n")) {
      if (line.startsWith("p")) continue;
      if (line.startsWith("f")) {
        if (currentName) {
          files.push({ fd: currentFd, type: "file", name: currentName });
        }
        currentFd = line.slice(1) || "?";
        currentName = "";
        continue;
      }
      if (line.startsWith("n")) {
        currentName = line.slice(1);
      }
    }

    if (currentName) {
      files.push({ fd: currentFd, type: "file", name: currentName });
    }

    return files.slice(0, 80);
  } catch {
    return [];
  }
}

async function getDarwinEnvironment(pid: number): Promise<Record<string, string>> {
  try {
    const { stdout } = await execFileAsync("ps", ["eww", "-p", String(pid), "-o", "command="]);
    return { COMMAND: stdout.trim() };
  } catch {
    return {};
  }
}

async function readLinuxCwd(pid: number): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("readlink", [`/proc/${pid}/cwd`]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}
