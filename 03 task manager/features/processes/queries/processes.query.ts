import type { ProcessListSnapshot } from "@/types/process";

export const processKeys = {
  all: ["processes"] as const,
  list: () => [...processKeys.all, "list"] as const,
};

export async function fetchProcesses(): Promise<ProcessListSnapshot> {
  const response = await fetch("/api/processes");

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? "Failed to fetch processes");
  }

  return response.json();
}
