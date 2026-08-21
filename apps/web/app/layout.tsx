import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Crazy Capital — Building India's Growth Story",
    template: "%s | Crazy Capital",
  },
  description:
    "India's most trusted technology-driven financial services platform. GST Registration, Company Incorporation, Business Loans, Insurance, and more.",
  keywords: ["GST registration", "company registration", "business loan", "financial services India"],
  openGraph: {
    title: "Crazy Capital — Building India's Growth Story",
    description: "One platform for all your business financial needs.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
