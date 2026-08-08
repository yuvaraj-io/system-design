"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Process } from "@/types/process";
import { cn } from "@/utils/cn";

interface SortableHeaderProps {
  column: Column<Process, unknown>;
  title: string;
}

export function SortableHeader({ column, title }: SortableHeaderProps) {
  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "inline-flex items-center gap-1.5 hover:text-foreground transition-colors",
        sorted && "text-foreground"
      )}
      aria-label={`Sort by ${title}`}
    >
      <span>{title}</span>
      {sorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}
