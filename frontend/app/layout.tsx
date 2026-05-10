import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoShare — Auto-apply for Nepal IPOs",
  description: "Never miss an IPO. Free, automatic, secure.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
