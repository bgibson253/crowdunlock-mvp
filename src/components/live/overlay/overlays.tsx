"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  Gift,
  Heart,
  Signal,
  Timer,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { AlertEvent, StreamConfig } from "@/components/live/overlay/types";

function useUptime(startedAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return `${hh ? String(hh).padStart(2, "0") + ":" : ""}${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function StreamOverlays(props: {
  stream: StreamConfig;
  viewerCount: number;
  theater: boolean;
  onToggleTheater: () => void;
  muted: boolean;
  onToggleMuted: () => void;
  conn: string;
}) {
  const uptime = useUptime(props.stream.startedAt);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Top-left meta */}
      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[85%] flex-wrap items-center gap-2">
        <Badge className="bg-black/55 text-white border-white/10">
          <Signal className="mr-1 h-3.5 w-3.5" />
          LIVE
        </Badge>
        <Badge className="bg-black/55 text-white border-white/10">
          <Users className="mr-1 h-3.5 w-3.5" />
          {props.viewerCount.toLocaleString()} watching
        </Badge>
        <Badge className="bg-black/55 text-white border-white/10">
          <Timer className="mr-1 h-3.5 w-3.5" />
          {uptime}
        </Badge>
        <Badge
          className={cn(
            "bg-black/55 text-white border-white/10",
            props.conn !== "connected" && "bg-amber-500/20 text-amber-200 border-amber-200/20"
          )}
        >
          {props.conn === "connected" ? "Realtime" : "Reconnecting…"}
        </Badge>
      </div>

      {/* Bottom-left title */}
      <div className="pointer-events-none absolute left-3 bottom-3 right-16">
        <Card className="border-white/10 bg-black/45 p-3">
          <div className="text-sm font-semibold leading-snug text-white">
            {props.stream.title}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
            <Crown className="h-3.5 w-3.5" />
            <span>
              {props.stream.host.displayName} (@{props.stream.host.username})
            </span>
          </div>
        </Card>
      </div>

      {/* Controls (pointer enabled) */}
      <div className="pointer-events-auto absolute right-3 bottom-3 flex flex-col gap-2">
        <Button
          variant="secondary"
          className="bg-black/55 text-white border border-white/10 hover:bg-black/40"
          onClick={props.onToggleMuted}
          aria-label={props.muted ? "Unmute" : "Mute"}
        >
          {props.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="secondary"
          className="bg-black/55 text-white border border-white/10 hover:bg-black/40 hidden lg:flex"
          onClick={props.onToggleTheater}
          aria-label="Toggle theater mode"
        >
          Theater
        </Button>
      </div>
    </div>
  );
}

export function AlertStack(props: {
  alerts: Array<{ id: string; event: AlertEvent; createdAt: number }>;
}) {
  const top = props.alerts[0] ?? null;

  const label = useMemo(() => {
    if (!top) return null;
    const e = top.event;
    if (e.t === "follow") return { icon: Heart, title: "New follow", line: e.user };
    if (e.t === "donation")
      return {
        icon: Gift,
        title: "Donation",
        line: `${e.user} donated $${e.amountUsd.toFixed(2)}`,
      };
    if (e.t === "sub")
      return {
        icon: Crown,
        title: "Subscription",
        line: `${e.user} subscribed${e.months ? ` (${e.months}mo)` : ""}`,
      };
    if (e.t === "gift")
      return {
        icon: Gift,
        title: "Gift",
        line: `${e.user} sent ${e.giftName}`,
      };
    return null;
  }, [top]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2">
      <AnimatePresence mode="popLayout">
        {label && (
          <motion.div
            key={top!.id}
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="w-[min(520px,92vw)]"
          >
            <div className="rounded-2xl border border-white/10 bg-black/65 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                  <label.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
                    {label.title}
                  </div>
                  <div className="truncate text-base font-semibold text-white">
                    {label.line}
                  </div>
                  <div className="mt-1 text-[11px] text-white/50">Sound: placeholder</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
