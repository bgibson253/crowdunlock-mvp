import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { TestModeBanner } from "@/components/site/test-mode-banner";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Unmaskr — Crowdfunded Content Unlocking",
    template: "%s | Unmaskr",
  },
  description: "Crowdfund and unlock exclusive journalism, data, and stories. Join the community.",
  openGraph: {
    siteName: "Unmaskr",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TestModeBanner />
        <Nav />
        <main className="min-h-[calc(100vh-140px)]">
          {children}
        </main>
        <Footer />
        <BackToTop />
        <Toaster richColors position="top-center" duration={4000} />
      </body>
    </html>
  );
}
