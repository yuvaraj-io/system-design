import type { Metadata } from "next";
import { SystemDashboard } from "@/features/system/components/system-dashboard";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export const metadata: Metadata = {
  title: "System | Process Explorer",
};

export default function SystemPage() {
  return (
    <Box>
      <Typography variant="overline" color="primary">
        Phase 9
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        System Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Overall CPU, memory, swap, disk, load average, and process/thread counts.
      </Typography>
      <SystemDashboard />
    </Box>
  );
}
