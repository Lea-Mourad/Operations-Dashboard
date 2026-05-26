import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

import AppShell from "@/components/AppShell";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Operations Command Center",
  description: "Internal operations workflow engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={syne.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
