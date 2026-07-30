"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Interest meter for request threads: turns discussion into a proto-campaign.
 * Shows how many people would fund this request and roughly how much intent
 * exists. Once interest is hot enough, nudges toward creating a real upload
 * with a funding goal.
 */
export function InterestMeter({
  threadId,
  userId,
  initialBackers,
  initialPledgedCents,
  initiallyInterested,
  isUploaderView,
}: {
  threadId: string;
  userId: string | null;
  initialBackers: number;
  initialPledgedCents: number;
  initiallyInterested: boolean;
  isUploaderView: boolean;
}) {
  const router = useRouter();
  const [backers, setBackers] = useState(initialBackers);
  const [pledgedCents, setPledgedCents] = useState(initialPledgedCents);
  const [interested, setInterested] = useState(initiallyInterested);
  const [busy, setBusy] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const [amount, setAmount] = useState<number | "">("");

  const pledgedDollars = Math.floor(pledgedCents / 100);
  const isHot = backers >= 5 || pledgedCents >= 10_000;

  async function toggle(withAmount?: number) {
    if (!userId) {
      router.push(`/auth?redirect=${encodeURIComponent(`/forum/${threadId}`)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/forum/threads/${threadId}/interest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(withAmount ? { amount: withAmount } : {}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "failed");
      setInterested(json.interested);
      setBackers(json.backers);
      setPledgedCents(json.pledged_cents);
      setShowAmount(false);
      setAmount("");
      if (json.interested) {
        toast.success(withAmount ? `Backed with ~$${withAmount} intent` : "You're in — we'll show demand to creators");
      }
    } catch {
      toast.error("Couldn't record interest. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold tabular-nums">{backers}</span>
            <span className="text-muted-foreground">would fund this</span>
          </div>
          {pledgedDollars > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold tabular-nums">${pledgedDollars}</span>
              <span className="text-muted-foreground">intent</span>
            </div>
          )}
          {isHot && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <Flame className="h-3 w-3" />
              Hot request
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showAmount && !interested ? (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                className="h-8 w-20 rounded-md border border-border/50 bg-background px-2 text-sm outline-none focus:border-primary/40"
                placeholder="25"
                autoFocus
              />
              <Button
                size="sm"
                disabled={busy || !amount || Number(amount) <= 0}
                onClick={() => toggle(Number(amount))}
              >
                Pledge
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAmount(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant={interested ? "secondary" : "default"}
                disabled={busy}
                onClick={() => toggle()}
                className={interested ? "" : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"}
              >
                {interested ? "✓ Interested" : "I'd fund this"}
              </Button>
              {!interested && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setShowAmount(true)}>
                  + amount
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isHot && isUploaderView && (
        <p className="mt-3 text-xs text-muted-foreground">
          🔥 This request has real demand.{" "}
          <a href="/upload" className="text-primary hover:underline font-medium">
            Create the upload
          </a>{" "}
          with a funding goal and these backers will be ready.
        </p>
      )}
    </div>
  );
}
