"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { ProcessFilters } from "@/features/processes/components/process-filters";
import { ProcessSearchBar } from "@/features/processes/components/process-search-bar";
import { ProcessTable } from "@/features/processes/components/process-table";
import { useProcessFilters } from "@/features/processes/hooks/use-process-filters";
import { useProcessesQuery } from "@/features/processes/hooks/use-processes-query";
import { ProcessTreeView } from "@/features/process-tree/components/process-tree-view";
import { ProcessDetailDrawer } from "@/features/process-detail/components/process-detail-drawer";
import { useUiStore } from "@/store/ui.store";
import { formatNumber } from "@/utils/format";

export function ProcessDashboardClient() {
  const { data, isLoading, isError, error, isFetching, dataUpdatedAt } =
    useProcessesQuery();

  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);

  const {
    debouncedSearch,
    filteredProcesses,
    matchedCount,
    totalCount,
    hasActiveFilters,
  } = useProcessFilters(data?.processes ?? [], data?.currentUser ?? "");

  if (isLoading) {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", p: 3 }}>
        <CircularProgress size={22} />
        <Typography color="text.secondary">Loading processes from the OS...</Typography>
      </Stack>
    );
  }

  if (isError || !data) {
    return (
      <Alert severity="error">
        {error instanceof Error ? error.message : "Failed to load processes"}
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Chip label={`Host: ${data.host}`} variant="outlined" />
        <Chip label={`Platform: ${data.platform}`} variant="outlined" />
        <Chip label={`User: ${data.currentUser}`} variant="outlined" />
        <Chip label={`Processes: ${formatNumber(data.processes.length)}`} variant="outlined" />
        <Chip label={`Refresh: every ${data.sampleIntervalMs / 1000}s`} variant="outlined" />
        <Chip
          icon={<RefreshIcon sx={{ fontSize: 16 }} />}
          label={
            <span suppressHydrationWarning>
              {`Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`}
            </span>
          }
          variant="outlined"
          color={isFetching ? "primary" : "default"}
        />
      </Stack>

      <ProcessSearchBar />
      <ProcessFilters matchedCount={matchedCount} totalCount={totalCount} />

      <Tabs
        value={viewMode}
        onChange={(_event, value) => setViewMode(value)}
        aria-label="process dashboard views"
      >
        <Tab icon={<TableRowsIcon />} iconPosition="start" label="Table" value="table" />
        <Tab icon={<AccountTreeIcon />} iconPosition="start" label="Tree" value="tree" />
      </Tabs>

      {viewMode === "table" ? (
        <ProcessTable
          processes={filteredProcesses}
          searchQuery={debouncedSearch}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        <ProcessTreeView processes={filteredProcesses} />
      )}

      <ProcessDetailDrawer processes={data.processes} />
    </Stack>
  );
}
