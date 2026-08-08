import type { Metadata } from "next";
import { ProcessDashboard } from "@/features/processes/components/process-dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Process Explorer",
};

export default function DashboardPage() {
  return <ProcessDashboard />;
}
