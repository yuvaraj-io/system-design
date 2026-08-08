import type { Process } from "@/types/process";
import type { ProcessTreeNode, ProcessTreeStats } from "@/types/process-tree";

/**
 * Builds a forest of process trees from a flat snapshot.
 * A node becomes a root when its parent PID is missing from the snapshot
 * (common for launchd/PID 1 children or when parent exited).
 *
 * Complexity: O(n) to index + O(n) to link children.
 */
export function buildProcessForest(processes: Process[]): ProcessTreeNode[] {
  const byPid = new Map<number, Process>();
  const childrenByPid = new Map<number, Process[]>();

  for (const process of processes) {
    byPid.set(process.pid, process);

    const siblings = childrenByPid.get(process.ppid) ?? [];
    siblings.push(process);
    childrenByPid.set(process.ppid, siblings);
  }

  function toTreeNode(process: Process, depth: number): ProcessTreeNode {
    const children = (childrenByPid.get(process.pid) ?? [])
      .sort(sortByName)
      .map((child) => toTreeNode(child, depth + 1));

    return { process, children, depth };
  }

  const roots = processes
    .filter((process) => process.ppid === 0 || !byPid.has(process.ppid))
    .sort((a, b) => a.pid - b.pid)
    .map((process) => toTreeNode(process, 0));

  return roots;
}

export function getProcessTreeStats(roots: ProcessTreeNode[]): ProcessTreeStats {
  let nodeCount = 0;
  let maxDepth = 0;

  const walk = (nodes: ProcessTreeNode[]) => {
    for (const node of nodes) {
      nodeCount += 1;
      maxDepth = Math.max(maxDepth, node.depth);
      walk(node.children);
    }
  };

  walk(roots);

  return {
    rootCount: roots.length,
    nodeCount,
    maxDepth,
  };
}

export function collectTreePids(roots: ProcessTreeNode[]): number[] {
  const pids: number[] = [];

  const walk = (nodes: ProcessTreeNode[]) => {
    for (const node of nodes) {
      pids.push(node.process.pid);
      walk(node.children);
    }
  };

  walk(roots);
  return pids;
}

function sortByName(a: Process, b: Process) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}
