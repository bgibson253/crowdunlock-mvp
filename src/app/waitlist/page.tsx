import Link from "next/link";
import { Suspense } from "react";
import { Bell, Lock, Mail, Sparkles } from "lucide-react";
import WaitlistClient from "./waitlist-client";

export const metadata = {
  title: "Get notified at launch — Unmaskr",
  description: "Join the Unmaskr waitlist. One announcement when we launch.",
};

const perks = [
  {
    icon: Bell,
    title: "One email. That's it.",
    desc: "A single announcement the moment we go live. No drip campaigns, no newsletters.",
  },
  {
    icon: Sparkles,
    title: "Early access",
    desc: "Waitlist members get in first — before the public open.",
  },
  {
    icon: Lock,
    title: "Your email stays yours",
    desc: "Never sold, never shared. Same promise we make about all your data.",
  },
];

export default function WaitlistPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-primary/6 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-chart-4/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto max-w-2xl">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
              <Mail className="h-3 w-3" />
              Launching soon
            </span>
          </div>

          <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
            Be first through the <span className="gradient-text">door</span>
          </h1>
          <p className="mt-4 text-center text-lg text-muted-foreground">
            Drop your email. No spam. One announcement when we go live.
          </p>

          <Suspense fallback={<WaitlistSkeleton />}>
            <WaitlistClient />
          </Suspense>

          {/* Perks */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <perk.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold">{perk.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Curious what we&rsquo;re building?{" "}
            <Link href="/" className="text-primary hover:underline">
              See how Unmaskr works
            </Link>{" "}
            or{" "}
            <Link href="/forum" className="text-primary hover:underline">
              browse the forum
            </Link>
            .
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
