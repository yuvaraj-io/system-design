"use client";

import DashboardIcon from "@mui/icons-material/Dashboard";
import MemoryIcon from "@mui/icons-material/Memory";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Processes", icon: DashboardIcon },
  { href: "/dashboard/system", label: "System", icon: MonitorHeartIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ gap: 2 }}>
          <MemoryIcon color="primary" />
          <Typography
            component={Link}
            href="/dashboard"
            variant="h6"
            color="text.primary"
            sx={{ textDecoration: "none", fontWeight: 700, mr: 2 }}
          >
            Process Explorer
          </Typography>

          <Stack direction="row" spacing={1}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  size="small"
                  variant={active ? "contained" : "text"}
                  startIcon={<Icon />}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

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
