"use client";

import { Clock, AlertTriangle, Unlock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const DEADLINE_LABELS: Record<string, string> = {
  "30d": "30-day deadline",
  "60d": "60-day deadline",
  "90d": "90-day deadline",
  "180d": "6-month deadline",
  "365d": "1-year deadline",
  none: "No deadline",
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Deadline reached";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);

  if (days > 30) return `${days} days remaining`;
  if (days > 0) return `${days}d ${hours}h remaining`;
  const minutes = Math.floor((totalSec % 3600) / 60);
  return `${hours}h ${minutes}m remaining`;
}

export function UnlockTimingBadge({
  fundingDeadline,
  deadlineAt,
  isFullyFunded,
  status,
}: {
  fundingDeadline: string;
  deadlineAt: string | null;
  isFullyFunded: boolean;
  status: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineAt) return;
    const target = new Date(deadlineAt).getTime();

    function tick() {
      setRemaining(target - Date.now());
    }
    tick();
    // Update every minute for long deadlines
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [deadlineAt]);

  // Already unlocked
  if (status === "unlocked") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <Unlock className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-medium text-emerald-400">
          Fully funded &amp; unlocked
        </span>
      </div>
    );
  }

  // Fully funded — will unlock
  if (isFullyFunded) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-medium text-emerald-400">
          Fully funded! Content unlocked for all contributors.
        </span>
      </div>
    );
  }

  // Deadline expired — refund pending
  if (deadlineAt && remaining !== null && remaining <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
        <span className="text-sm font-medium text-red-400">
          Funding deadline reached — contributions will be refunded
        </span>
      </div>
    );
  }

  // Active deadline countdown
  if (deadlineAt && remaining !== null && remaining > 0) {
    const isUrgent = remaining < 7 * 24 * 60 * 60 * 1000; // < 7 days
    return (
      <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
        isUrgent
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border/50 bg-card/30"
      }`}>
        <Clock className={`h-4 w-4 shrink-0 ${isUrgent ? "text-amber-400" : "text-muted-foreground"}`} />
        <span className={`text-sm font-medium ${isUrgent ? "text-amber-400" : "text-muted-foreground"}`}>
          {formatCountdown(remaining)} to reach funding goal
        </span>
        {isUrgent && (
          <span className="text-xs text-amber-400/70 ml-1">
            — unfunded contributions will be refunded
          </span>
        )}
      </div>
    );
  }

  // No deadline set, or open-ended
  if (fundingDeadline === "none" || !deadlineAt) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Open-ended funding (no deadline)
        </Badge>
      </div>
    );
  }

  // Fallback: show the chosen deadline label
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        {DEADLINE_LABELS[fundingDeadline] ?? "Funding deadline set"}
      </Badge>
    </div>
  );
}
