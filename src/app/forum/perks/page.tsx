import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIERS = [
  { dollars: 50, icon: "🟩", label: "Half Stack" },
  { dollars: 100, icon: "💵", label: "It's all about the Benjamin" },
  { dollars: 200, icon: "💵💵", label: "It's all about the Benjamins" },
  { dollars: 300, icon: "🧱", label: "Three-Plate Stack" },
  { dollars: 500, icon: "📣💰", label: "Money Talks" },
  { dollars: 750, icon: "🧾🕵️", label: "Paper Trail" },
  { dollars: 1000, icon: "🏦", label: "Four-Figure Financier" },
  { dollars: 2000, icon: "💎", label: "Double-K Patron" },
  { dollars: 5000, icon: "🕶️", label: "Quiet Backer" },
  { dollars: 10000, icon: "👑", label: "Kingmaker" },
  { dollars: 25000, icon: "🌑", label: "Shadow Sponsor" },
  { dollars: 50000, icon: "🤝💼", label: "Dealmaker" },
  { dollars: 100000, icon: "🗝️", label: "The Vault Opens" },
  { dollars: 250000, icon: "🎭⚡", label: "The Mask Breaker" },
  { dollars: 500000, icon: "🜁", label: "The Unmasker" },
  { dollars: 1000000, icon: "👁️", label: "The Final Reveal" },
];

export const dynamic = "force-dynamic";

export default function ForumPerksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Unlock Perks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your forum badge is based on your <span className="font-medium">gross unlock purchases</span>.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {TIERS.map((t) => (
              <div
                key={t.dollars}
                className="flex items-center justify-between rounded-xl border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-lg" aria-hidden>
                    {t.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.label}</div>
                    <div className="text-xs text-muted-foreground">Spend ${t.dollars}+ in unlocks</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Badge updates automatically after each unlock purchase.
          </div>

          <div className="text-sm">
            Back to <Link className="underline" href="/forum">Forum</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
