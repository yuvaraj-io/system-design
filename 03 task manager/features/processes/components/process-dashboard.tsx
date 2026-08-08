import MemoryIcon from "@mui/icons-material/Memory";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ProcessDashboardClient } from "@/features/processes/components/process-dashboard-client";

export function ProcessDashboard() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="overline" color="primary">
            Phase 7
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Process Explorer
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
            Browse all processes by default, inspect details on click, and explore parent-child trees.
          </Typography>
        </Box>
        <MemoryIcon color="primary" sx={{ fontSize: 40 }} />
      </Stack>

      <ProcessDashboardClient />
    </Stack>
  );
}
