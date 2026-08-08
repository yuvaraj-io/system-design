"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { HighlightText } from "@/features/processes/components/highlight-text";
import { StateBadge } from "@/features/processes/components/state-badge";
import { TruncatedText } from "@/features/processes/components/truncated-text";
import { useFiltersStore } from "@/store/filters.store";
import { useUiStore } from "@/store/ui.store";
import type { Process } from "@/types/process";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatUptime,
} from "@/utils/format";

const columnHelper = createColumnHelper<Process>();
const DEFAULT_PAGE_SIZE = 50;

function SortableHeader({
  column,
  title,
}: {
  column: Column<Process, unknown>;
  title: string;
}) {
  const sorted = column.getIsSorted();

  return (
    <Box
      component="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        border: 0,
        background: "none",
        color: sorted ? "text.primary" : "text.secondary",
        cursor: "pointer",
        p: 0,
        font: "inherit",
      }}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUpwardIcon sx={{ fontSize: 16 }} />
      ) : sorted === "desc" ? (
        <ArrowDownwardIcon sx={{ fontSize: 16 }} />
      ) : (
        <UnfoldMoreIcon sx={{ fontSize: 16, opacity: 0.5 }} />
      )}
    </Box>
  );
}

function createColumns(searchQuery: string) {
  return [
    columnHelper.accessor((row) => row.pid, {
      id: "pid",
      header: ({ column }) => <SortableHeader column={column} title="PID" />,
      cell: (info) => (
        <HighlightText text={formatNumber(info.getValue())} query={searchQuery} />
      ),
      sortingFn: "basic",
    }),
    columnHelper.accessor((row) => row.name, {
      id: "name",
      header: ({ column }) => <SortableHeader column={column} title="Process Name" />,
      cell: (info) => (
        <TruncatedText text={info.getValue()} query={searchQuery} sx={{ fontWeight: 600 }} />
      ),
      sortingFn: "alphanumeric",
    }),
    columnHelper.accessor((row) => row.ppid, {
      id: "ppid",
      header: "PPID",
      cell: (info) => formatNumber(info.getValue()),
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.user, {
      id: "user",
      header: "User",
      cell: (info) => <HighlightText text={info.getValue()} query={searchQuery} />,
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.metrics.cpuPercent, {
      id: "cpu",
      header: ({ column }) => <SortableHeader column={column} title="CPU %" />,
      cell: (info) => (
        <Box
          component="span"
          sx={{ color: info.getValue() >= 10 ? "warning.dark" : "text.primary" }}
        >
          {formatPercent(info.getValue())}
        </Box>
      ),
      sortingFn: "basic",
    }),
    columnHelper.accessor((row) => row.metrics.memoryRssBytes, {
      id: "memory",
      header: ({ column }) => <SortableHeader column={column} title="Memory (RSS)" />,
      cell: (info) => formatBytes(info.getValue()),
      sortingFn: "basic",
    }),
    columnHelper.accessor((row) => row.metrics.threadCount, {
      id: "threads",
      header: ({ column }) => <SortableHeader column={column} title="Threads" />,
      cell: (info) => formatNumber(info.getValue()),
      sortingFn: "basic",
    }),
    columnHelper.accessor((row) => row.metrics.uptimeSeconds, {
      id: "uptime",
      header: "Uptime",
      cell: (info) => formatUptime(info.getValue()),
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row.state, {
      id: "state",
      header: "State",
      cell: (info) => <StateBadge state={info.getValue()} />,
      enableSorting: false,
    }),
  ];
}

interface ProcessTableProps {
  processes: Process[];
  searchQuery?: string;
  hasActiveFilters?: boolean;
}

export function ProcessTable({
  processes,
  searchQuery = "",
  hasActiveFilters = false,
}: ProcessTableProps) {
  const sorting = useFiltersStore((state) => state.sorting);
  const setSorting = useFiltersStore((state) => state.setSorting);
  const setSelectedPid = useUiStore((state) => state.setSelectedPid);
  const setDetailOpen = useUiStore((state) => state.setDetailOpen);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const columns = useMemo(() => createColumns(searchQuery), [searchQuery]);
  const data = useMemo(() => processes, [processes]);

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [processes.length, searchQuery, hasActiveFilters]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(nextSorting as SortingState);
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => String(row.pid),
    enableMultiSort: false,
    autoResetPageIndex: false,
  });

  const rows = table.getRowModel().rows;

  if (hasActiveFilters && processes.length === 0) {
    return (
      <Paper sx={{ p: 5, textAlign: "center" }}>
        <Typography variant="h6">No processes match your filters</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try clearing search text or state filters.
        </Typography>
      </Paper>
    );
  }

  if (processes.length === 0) {
    return (
      <Paper sx={{ p: 5, textAlign: "center" }}>
        <Typography variant="h6">No process data available</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Waiting for the next snapshot from the OS...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}
      >
        <Typography variant="body2" color="text.secondary">
          {formatNumber(processes.length)} process{processes.length === 1 ? "" : "es"} total
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click a row for process details
        </Typography>
      </Stack>

      <TableContainer sx={{ maxHeight: 560 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id} sx={{ bgcolor: "background.paper" }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Unable to render rows. Try changing sort or refreshing.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedPid(row.original.pid);
                    setDetailOpen(true);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={processes.length}
        page={pagination.pageIndex}
        onPageChange={(_event, page) =>
          setPagination((current) => ({ ...current, pageIndex: page }))
        }
        rowsPerPage={pagination.pageSize}
        onRowsPerPageChange={(event) =>
          setPagination({
            pageIndex: 0,
            pageSize: Number(event.target.value),
          })
        }
        rowsPerPageOptions={[25, 50, 100, 200]}
      />
    </Paper>
  );
}
