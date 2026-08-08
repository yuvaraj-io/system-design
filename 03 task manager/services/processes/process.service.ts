import "server-only";

import type { ProcessListSnapshot } from "@/types/process";
import { createProcessCollector } from "./collectors/platform.collector";

const collector = createProcessCollector();

export async function getProcessListSnapshot(): Promise<ProcessListSnapshot> {
  return collector.listProcesses();
}
