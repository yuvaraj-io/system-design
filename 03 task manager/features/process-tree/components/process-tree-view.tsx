"use client";

import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef } from "react";
import { ProcessTreePanel } from "@/features/process-tree/components/process-tree-panel";
import { useUiStore } from "@/store/ui.store";
import type { Process } from "@/types/process";
import { buildProcessForest, getProcessTreeStats } from "@/utils/process-tree";

interface ProcessTreeViewProps {
  processes: Process[];
}

export function ProcessTreeView({ processes }: ProcessTreeViewProps) {
  const expandRoots = useUiStore((state) => state.expandRoots);
  const collapseAll = useUiStore((state) => state.collapseAll);

  const roots = useMemo(() => buildProcessForest(processes), [processes]);
  const stats = useMemo(() => getProcessTreeStats(roots), [roots]);
  const didExpandRoots = useRef(false);

  useEffect(() => {
    if (!didExpandRoots.current && roots.length > 0) {
      expandRoots(roots.map((root) => root.process.pid));
      didExpandRoots.current = true;
    }
  }, [roots, expandRoots]);

  return (
    <Paper>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", p: 2 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <AccountTreeOutlinedIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Process Tree
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Parent → child hierarchy using PID / PPID links
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UnfoldMoreIcon />}
            onClick={() => expandRoots(roots.map((root) => root.process.pid))}
          >
            Expand roots
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UnfoldLessIcon />}
            onClick={collapseAll}
          >
            Collapse all
          </Button>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ px: 2, pb: 1, display: "block" }}>
        {stats.rootCount} roots · max depth {stats.maxDepth}
      </Typography>

      <ProcessTreePanel roots={roots} />
    </Paper>
  );
}
