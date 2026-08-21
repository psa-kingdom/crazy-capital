import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Crazy Capital Admin",
    template: "%s | CC Admin",
  },
  description: "Crazy Capital internal administration portal.",
  robots: { index: false, follow: false },
};

import { AdminShell } from "../components/layout/admin-shell";

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
