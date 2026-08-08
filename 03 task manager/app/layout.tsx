import type { Metadata } from "next";
import { AppProviders } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Process Explorer",
  description: "Educational Activity Monitor built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
