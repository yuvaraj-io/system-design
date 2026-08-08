import type { ProcessListSnapshot } from "@/types/process";

export interface ProcessCollector {
  listProcesses(): Promise<ProcessListSnapshot>;
}
