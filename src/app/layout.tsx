import type { Metadata } from "next";
import "./globals.css";

import { Nav } from "@/components/site/nav";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "CrowdUnlock",
  description: "Community-powered document unlock platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Nav />
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
