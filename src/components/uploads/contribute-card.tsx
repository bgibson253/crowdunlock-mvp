"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRESETS = [5, 10, 25, 50, 100];

export function ContributeCard({
  uploadId,
  currentFunded,
  fundingGoal,
  unlocked = false,
}: {
  uploadId: string;
  currentFunded: number;
  fundingGoal: number;
  unlocked?: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | "">(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onContribute() {
    if (!amount || amount <= 0) return;
    setError(null);
    setSubmitting(true);

    try {
      const supabase = supabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be signed in to contribute.");
        return;
      }

      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ upload_id: uploadId, amount }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to contribute");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.message ?? "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const pct = Math.min(100, Math.round((currentFunded / fundingGoal) * 100));
  const remainingDollars = Math.max(0, Math.floor((fundingGoal - currentFunded) / 100));
  const currentDollars = Math.floor(currentFunded / 100);
  const goalDollars = Math.floor(fundingGoal / 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {unlocked ? "Tip the community" : "Fund this upload"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {unlocked && (
          <p className="text-sm text-muted-foreground">
            This upload is already unlocked! Contributions still count toward your backer tier.
          </p>
        )}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">${currentDollars} raised</span>
            <span className="text-muted-foreground">${goalDollars} goal</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">${remainingDollars} to go • {pct}% funded</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={amount === p ? "default" : "outline"}
              onClick={() => setAmount(p)}
            >
              ${p}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">$</span>
          <Input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
            className="w-28"
            placeholder="Custom"
          />
          <Button onClick={onContribute} disabled={submitting || !amount || amount <= 0}>
            {submitting ? "Processing…" : success ? "✓ Done!" : "Contribute"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-400 font-medium">
            Contribution recorded! Thank you.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
