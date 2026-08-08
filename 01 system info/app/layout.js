import "./globals.css";

export const metadata = {
  title: "System Info Dashboard",
  description: "Live CPU, memory, disk, and thread utilization",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
