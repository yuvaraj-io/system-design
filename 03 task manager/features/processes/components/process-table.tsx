"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { HighlightText } from "@/features/processes/components/highlight-text";
import { StateBadge } from "@/features/processes/components/state-badge";
import type { Process } from "@/types/process";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatUptime,
} from "@/utils/format";

const columnHelper = createColumnHelper<Process>();

function createColumns(searchQuery: string) {
  return [
    columnHelper.accessor("pid", {
      header: "PID",
      cell: (info) => (
        <HighlightText text={formatNumber(info.getValue())} query={searchQuery} />
      ),
    }),
    columnHelper.accessor("name", {
      header: "Process Name",
      cell: (info) => (
        <span className="font-medium">
          <HighlightText text={info.getValue()} query={searchQuery} />
        </span>
      ),
    }),
    columnHelper.accessor("ppid", {
      header: "PPID",
      cell: (info) => formatNumber(info.getValue()),
    }),
    columnHelper.accessor("user", {
      header: "User",
      cell: (info) => <HighlightText text={info.getValue()} query={searchQuery} />,
    }),
    columnHelper.accessor("metrics.cpuPercent", {
      header: "CPU %",
      cell: (info) => (
        <span className={info.getValue() >= 10 ? "text-amber-300" : undefined}>
          {formatPercent(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("metrics.memoryRssBytes", {
      header: "Memory (RSS)",
      cell: (info) => formatBytes(info.getValue()),
    }),
    columnHelper.accessor("metrics.memoryVszBytes", {
      header: "Virtual Memory",
      cell: (info) => formatBytes(info.getValue()),
    }),
    columnHelper.accessor("metrics.threadCount", {
      header: "Threads",
      cell: (info) => formatNumber(info.getValue()),
    }),
    columnHelper.accessor("metrics.uptimeSeconds", {
      header: "Uptime",
      cell: (info) => formatUptime(info.getValue()),
    }),
    columnHelper.accessor("metrics.startTime", {
      header: "Start Time",
      cell: (info) => formatDateTime(info.getValue()),
    }),
    columnHelper.accessor("state", {
      header: "State",
      cell: (info) => <StateBadge state={info.getValue()} />,
    }),
  ];
}

interface ProcessTableProps {
  processes: Process[];
  searchQuery?: string;
  isFiltering?: boolean;
}

export function ProcessTable({
  processes,
  searchQuery = "",
  isFiltering = false,
}: ProcessTableProps) {
  const columns = useMemo(() => createColumns(searchQuery), [searchQuery]);
  const data = useMemo(() => processes, [processes]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isFiltering && processes.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-lg font-medium">No processes match your search</p>
        <p className="mt-2 text-sm text-muted">
          Try a PID, process name, or username.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-white/5 text-left text-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/70 hover:bg-white/5"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
