import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { TestModeBanner } from "@/components/site/test-mode-banner";
import { ClientShell } from "@/components/site/client-shell";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // secondary font — don't block render
});

export const metadata: Metadata = {
  title: {
    default: "Unmaskr — You Decide What Gets Uncovered",
    template: "%s | Unmaskr",
  },
  description: "Crowdfund and unlock journalism, data, and stories for the public. Join the community.",
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
        <link rel="dns-prefetch" href="https://xdkegpiirkdgzjhycqcc.supabase.co" />
        <link rel="preconnect" href="https://xdkegpiirkdgzjhycqcc.supabase.co" crossOrigin="anonymous" />
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
        <ClientShell />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`
          }}
        />
      </body>
    </html>
  );
}
