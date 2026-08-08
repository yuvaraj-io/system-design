import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Process Explorer",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
            <Activity className="h-5 w-5 text-accent" />
            Process Explorer
          </Link>
          <span className="text-sm text-muted">Next.js full-stack monitor</span>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
