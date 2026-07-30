import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

import { UNLOCK_TIERS as TIERS } from "@/lib/unlock-tiers";

export const metadata = {
  title: "Unlock Perks",
  description:
    "Earn forum badges by unlocking content. From First Bill to Unmaskr Legend — it's all about the Benjamins.",
};

// Static page — no DB calls, pure UI

/** Visual weight per rung: early tiers are paper, late tiers glow. */
function tierStyle(index: number, total: number): { border: string; bg: string; glow: string } {
  const t = index / Math.max(1, total - 1);
  if (t < 0.25) return { border: "border-border/60", bg: "bg-card/50", glow: "" };
  if (t < 0.5) return { border: "border-emerald-500/30", bg: "bg-emerald-500/5", glow: "" };
  if (t < 0.75) return { border: "border-primary/40", bg: "bg-primary/5", glow: "shadow-lg shadow-primary/10" };
  return { border: "border-amber-500/40", bg: "bg-amber-500/5", glow: "shadow-xl shadow-amber-500/10" };
}

export default function ForumPerksPage() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-sm mb-6">
            <TrendingUp className="h-3 w-3" />
            Unlock Perks
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            It&rsquo;s All About the <span className="gradient-text">Benjamins</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Every dollar you put into unlocks climbs this ladder. Your badge shows next to
            everything you post — proof you put money where the truth is.
          </p>
        </div>

        {/* The ladder — bottom rung first */}
        <div className="space-y-2.5">
          {TIERS.map((t, i) => {
            const s = tierStyle(i, TIERS.length);
            return (
              <div
                key={t.dollars}
                className={`flex items-center gap-4 rounded-xl border ${s.border} ${s.bg} ${s.glow} px-5 py-4 backdrop-blur-sm transition-transform hover:scale-[1.01]`}
              >
                <div className="text-2xl w-12 text-center shrink-0" aria-hidden>
                  {t.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-xs text-muted-foreground italic mt-0.5">{t.blurb}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold tabular-nums">
                    ${t.dollars.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    in unlocks
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Badges update automatically after each unlock purchase. Totals are lifetime gross.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/forum"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Forum
          </Link>
        </div>
      </div>
    </div>
  );
}
