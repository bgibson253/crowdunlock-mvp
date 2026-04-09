import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { KeyboardShortcuts } from "@/components/site/keyboard-shortcuts";
import { TestModeBanner } from "@/components/site/test-mode-banner";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Unmaskr — You Decide What Gets Uncovered",
    template: "%s | Unmaskr",
  },
  description: "Crowdfund and unlock exclusive journalism, data, and stories. Join the community.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Unmaskr",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Unmaskr",
    type: "website",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <TestModeBanner />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg">
          Skip to content
        </a>
        <Nav />
        <main id="main-content" role="main" className="min-h-[calc(100vh-140px)]">
          {children}
        </main>
        <Footer />
        <BackToTop />
        <KeyboardShortcuts />
        <Toaster
          richColors
          position="top-center"
          duration={4000}
          toastOptions={{
            style: {
              background: "oklch(0.16 0.02 260)",
              border: "1px solid oklch(1 0 0 / 10%)",
              color: "oklch(0.93 0.005 260)",
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`
          }}
        />
      </body>
    </html>
  );
}
