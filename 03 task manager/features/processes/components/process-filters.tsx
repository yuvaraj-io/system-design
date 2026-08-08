"use client";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useFiltersStore } from "@/store/filters.store";
import type { ProcessCategoryFilter, ProcessStateFilter } from "@/types/filters";

const STATE_FILTERS: { value: ProcessStateFilter; label: string }[] = [
  { value: "running", label: "Running" },
  { value: "sleeping", label: "Sleeping" },
  { value: "zombie", label: "Zombie" },
  { value: "background", label: "Background" },
];

interface ProcessFiltersProps {
  matchedCount: number;
  totalCount: number;
}

export function ProcessFilters({ matchedCount, totalCount }: ProcessFiltersProps) {
  const category = useFiltersStore((state) => state.category);
  const stateFilters = useFiltersStore((state) => state.stateFilters);
  const setCategory = useFiltersStore((state) => state.setCategory);
  const toggleStateFilter = useFiltersStore((state) => state.toggleStateFilter);
  const clearStateFilters = useFiltersStore((state) => state.clearStateFilters);
  const resetFilters = useFiltersStore((state) => state.resetFilters);

  const handleCategoryChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: ProcessCategoryFilter | null
  ) => {
    if (value) setCategory(value);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <FilterAltOutlinedIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            Showing {matchedCount} of {totalCount}
          </Typography>
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Process owner
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={category}
            onChange={handleCategoryChange}
            aria-label="process category filter"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="user">My Processes</ToggleButton>
            <ToggleButton value="system">System</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Process state
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {STATE_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                clickable
                color={stateFilters.includes(filter.value) ? "primary" : "default"}
                variant={stateFilters.includes(filter.value) ? "filled" : "outlined"}
                onClick={() => toggleStateFilter(filter.value)}
              />
            ))}
            {stateFilters.length > 0 && (
              <Chip label="Clear states" variant="outlined" onClick={clearStateFilters} />
            )}
          </Stack>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Background = idle or sleeping with CPU &lt; 0.1%. System = root and underscore users.
          No filters selected = show everything.
        </Typography>

        <Chip
          label="Reset all filters"
          variant="outlined"
          onClick={resetFilters}
          sx={{ alignSelf: "flex-start" }}
        />
      </Stack>
    </Paper>
  );
}
