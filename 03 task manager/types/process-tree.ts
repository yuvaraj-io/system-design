import type { Process } from "@/types/process";

export interface ProcessTreeNode {
  process: Process;
  children: ProcessTreeNode[];
  depth: number;
}

export interface ProcessTreeStats {
  rootCount: number;
  nodeCount: number;
  maxDepth: number;
}
