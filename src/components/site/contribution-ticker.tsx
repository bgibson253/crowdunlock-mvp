"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrendingUp, X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

type ContributionEvent = {
  id: string;
  upload_id: string;
  upload_title: string;
  amount_cents: number;
  pct_funded: number;
};

/**
 * Site-wide realtime ticker: when anyone contributes money to an upload,
 * a banner slides in at the top. Anonymous by design — shows the amount and
 * the upload, never the contributor.
 */
export function ContributionTicker() {
  const [event, setEvent] = useState<ContributionEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("contribution-ticker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contribution_events" },
        (payload) => {
          const e = payload.new as ContributionEvent;
          if (!e?.upload_title) return;
          setEvent(e);
          setVisible(true);
          if (hideTimer.current) clearTimeout(hideTimer.current);
          hideTimer.current = setTimeout(() => setVisible(false), 8000);
        },
      )
      .subscribe();

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      supabase.removeChannel(channel);
    };
  }, []);

  if (!event) return null;

  const dollars = Math.floor(event.amount_cents / 100);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[90] flex justify-center px-4 transition-transform duration-500 ease-out ${
        visible ? "translate-y-2" : "-translate-y-24"
      }`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-full border border-emerald-500/30 bg-background/95 py-2 pl-3 pr-2 shadow-xl shadow-emerald-500/10 backdrop-blur-md">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
        </span>
        <Link
          href={`/uploads/${event.upload_id}`}
          onClick={() => setVisible(false)}
          className="text-sm hover:underline"
        >
          <span className="font-semibold text-emerald-400">${dollars}</span>{" "}
          <span className="text-muted-foreground">just backed</span>{" "}
          <span className="font-medium">{event.upload_title.length > 44 ? `${event.upload_title.slice(0, 44)}…` : event.upload_title}</span>{" "}
          <span className="text-muted-foreground">· {event.pct_funded}% funded</span>
        </Link>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
