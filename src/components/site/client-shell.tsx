"use client";

import dynamic from "next/dynamic";

// Lazy-load non-critical UI — these don't affect LCP
const BackToTop = dynamic(
  () => import("@/components/site/back-to-top").then((m) => m.BackToTop),
  { ssr: false }
);
const KeyboardShortcuts = dynamic(
  () =>
    import("@/components/site/keyboard-shortcuts").then(
      (m) => m.KeyboardShortcuts
    ),
  { ssr: false }
);
const CookieConsent = dynamic(
  () =>
    import("@/components/site/cookie-consent").then((m) => m.CookieConsent),
  { ssr: false }
);
const LazyToaster = dynamic(
  () => import("sonner").then((m) => m.Toaster),
  { ssr: false }
);

export function ClientShell() {
  return (
    <>
      <BackToTop />
      <KeyboardShortcuts />
      <LazyToaster
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
      <CookieConsent />
    </>
  );
}
