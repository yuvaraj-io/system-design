"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import { StateBadge } from "@/features/processes/components/state-badge";
import { TruncatedText } from "@/features/processes/components/truncated-text";
import { useUiStore } from "@/store/ui.store";
import type { ProcessTreeNode } from "@/types/process-tree";
import { formatBytes, formatPercent } from "@/utils/format";

interface ProcessTreeRowProps {
  node: ProcessTreeNode;
}

function ProcessTreeRow({ node }: ProcessTreeRowProps) {
  const expandedPids = useUiStore((state) => state.expandedPids);
  const selectedPid = useUiStore((state) => state.selectedPid);
  const toggleExpanded = useUiStore((state) => state.toggleExpanded);
  const setSelectedPid = useUiStore((state) => state.setSelectedPid);
  const setDetailOpen = useUiStore((state) => state.setDetailOpen);

  const hasChildren = node.children.length > 0;
  const isExpanded = Boolean(expandedPids[node.process.pid]);
  const isSelected = selectedPid === node.process.pid;

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => {
          setSelectedPid(node.process.pid);
          setDetailOpen(true);
        }}
        sx={{
          pl: 1 + node.depth * 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) toggleExpanded(node.process.pid);
          }}
          sx={{ mr: 0.5, visibility: hasChildren ? "visible" : "hidden" }}
          aria-label={isExpanded ? "Collapse process branch" : "Expand process branch"}
        >
          {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>

        <ListItemText
          primary={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <TruncatedText text={node.process.name} sx={{ fontWeight: 600 }} />
              <Typography component="span" variant="body2" color="text.secondary">
                PID {node.process.pid} · PPID {node.process.ppid}
              </Typography>
              <StateBadge state={node.process.state} />
            </Stack>
          }
          secondary={`${node.process.user} · CPU ${formatPercent(node.process.metrics.cpuPercent)} · RSS ${formatBytes(node.process.metrics.memoryRssBytes)} · ${node.children.length} child${node.children.length === 1 ? "" : "ren"}`}
        />
      </ListItemButton>

      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {node.children.map((child) => (
              <ProcessTreeRow key={child.process.pid} node={child} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

interface ProcessTreePanelProps {
  roots: ProcessTreeNode[];
}

export function ProcessTreePanel({ roots }: ProcessTreePanelProps) {
  const isEmpty = roots.length === 0;

  const totalNodes = useMemo(() => {
    let count = 0;
    const walk = (nodes: ProcessTreeNode[]) => {
      for (const node of nodes) {
        count += 1;
        walk(node.children);
      }
    };
    walk(roots);
    return count;
  }, [roots]);

  if (isEmpty) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">No processes to show in the tree</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Clear filters or switch back to table view.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
        {roots.length} root process{roots.length === 1 ? "" : "es"} · {totalNodes} visible node
        {totalNodes === 1 ? "" : "s"}
      </Typography>
      <List disablePadding>
        {roots.map((root) => (
          <ProcessTreeRow key={root.process.pid} node={root} />
        ))}
      </List>
    </Box>
  );
}
