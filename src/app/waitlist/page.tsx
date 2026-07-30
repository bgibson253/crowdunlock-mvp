import Link from "next/link";
import { Suspense } from "react";
import WaitlistClient from "./waitlist-client";

export const metadata = {
  title: "Get notified at launch — Unmaskr",
  description: "Join the Unmaskr waitlist. One announcement when we launch.",
};

export default function WaitlistPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-primary/6 rounded-full blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
            Get notified at launch
          </h1>
          <p className="mt-4 text-center text-lg text-muted-foreground">
            Drop your email. No spam. One announcement when we go live.
          </p>

          <Suspense fallback={<WaitlistSkeleton />}>
            <WaitlistClient />
          </Suspense>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="underline">
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function WaitlistSkeleton() {
  return (
    <div className="mt-10 rounded-2xl border border-primary/15 bg-primary/5 p-5 backdrop-blur">
      <div className="h-12 animate-pulse rounded-xl bg-primary/10" />
    </div>
  );
}
