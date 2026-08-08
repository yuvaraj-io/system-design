import "./globals.css";

export const metadata = {
  title: "System Stress Dashboard",
  description: "Stress CPU, memory, disk, and threads while watching live metrics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
