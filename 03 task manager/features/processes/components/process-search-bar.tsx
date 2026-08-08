"use client";

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useFiltersStore } from "@/store/filters.store";

export function ProcessSearchBar() {
  const searchQuery = useFiltersStore((state) => state.searchQuery);
  const setSearchQuery = useFiltersStore((state) => state.setSearchQuery);
  const clearSearch = useFiltersStore((state) => state.clearSearch);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <TextField
          fullWidth
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by PID, name, or user..."
          aria-label="Search processes"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton aria-label="clear search" onClick={clearSearch} edge="end">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Examples: PID <code>1234</code>, name <code>node</code>, user <code>root</code>
        </Typography>
      </Stack>
    </Paper>
  );
}
