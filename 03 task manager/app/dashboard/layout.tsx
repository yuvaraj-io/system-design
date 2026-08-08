"use client";

import MemoryIcon from "@mui/icons-material/Memory";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <MemoryIcon color="primary" sx={{ mr: 1 }} />
          <Typography
            component={Link}
            href="/dashboard"
            variant="h6"
            color="text.primary"
            sx={{ textDecoration: "none", fontWeight: 700 }}
          >
            Process Explorer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            Next.js + Material UI
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
