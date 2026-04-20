"use client";

import { useEffect, useMemo, useState } from "react";

import { LiveStreamOverlay } from "@/components/live/overlay/live-stream-overlay";
import type { StreamConfig } from "@/components/live/overlay/types";

export function LiveDemo() {
  const [now] = useState(() => Date.now());

  const stream: StreamConfig = useMemo(
    () => ({
      title: "Unmaskr Live — Premium Overlay Demo",
      host: {
        id: "host_1",
        username: "Benjammin253",
        displayName: "Ben",
        avatarUrl: null,
      },
      hlsUrl:
        process.env.NEXT_PUBLIC_DEMO_HLS_URL ||
        "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      chatWsUrl: process.env.NEXT_PUBLIC_CHAT_WS_URL || "http://localhost:4001",
      roomId: "demo-room",
      startedAt: now - 1000 * 60 * 7,
      isLive: true,
    }),
    [now]
  );

  // seed a dark theme baseline (Tailwind v4 CSS vars are in globals already)
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <LiveStreamOverlay
      stream={stream}
      me={{ id: "me", username: "you", avatarUrl: null }}
    />
  );
}
