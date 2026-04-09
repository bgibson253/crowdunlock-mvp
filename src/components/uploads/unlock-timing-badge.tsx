"use client";

import { Clock, Timer, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const MODE_LABELS: Record<string, string> = {
  instant: "Instant unlock",
  timed_24h: "24h after funded",
  timed_48h: "48h after funded",
  timed_7d: "7 days after funded",
  manual: "Manual unlock by uploader",
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Unlocking soon…";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}

export function UnlockTimingBadge({
  unlockMode,
  unlockAt,
  isFullyFunded,
}: {
  unlockMode: string;
  unlockAt: string | null;
  isFullyFunded: boolean;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!unlockAt) return;
    const target = new Date(unlockAt).getTime();

    function tick() {
      setRemaining(target - Date.now());
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [unlockAt]);

  // Timed mode with active countdown
  if (unlockAt && remaining !== null && remaining > 0 && isFullyFunded) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <Timer className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-sm font-medium text-amber-600">
          Fully funded! Unlocks in {formatCountdown(remaining)}
        </span>
      </div>
    );
  }

  // Timed mode, countdown expired
  if (unlockAt && remaining !== null && remaining <= 0 && isFullyFunded) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <Unlock className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-medium text-emerald-600">
          Unlocking soon…
        </span>
      </div>
    );
  }

  // Manual mode, fully funded but not yet unlocked
  if (unlockMode === "manual" && isFullyFunded) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/5 px-4 py-3">
        <Lock className="h-4 w-4 text-purple-500 shrink-0" />
        <span className="text-sm font-medium text-purple-600">
          Fully funded — waiting for uploader to unlock
        </span>
      </div>
    );
  }

  // Not fully funded yet — show what will happen
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        {MODE_LABELS[unlockMode] ?? "Instant unlock"}
      </Badge>
    </div>
  );
}
