"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { io, Socket } from "socket.io-client";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { QualityMenu } from "@/components/live/overlay/quality-menu";
import { ChatPanel } from "@/components/live/overlay/chat-panel";
import { MobileChatDrawer } from "@/components/live/overlay/mobile-chat-drawer";
import { PollCard } from "@/components/live/overlay/polls";
import { ReactionBar, BurstReactions } from "@/components/live/overlay/reactions";
import { AlertStack, StreamOverlays } from "@/components/live/overlay/overlays";
import { HostPill } from "@/components/live/overlay/host-pill";
import { useIsDesktop } from "@/components/live/overlay/use-media-query";
import { sanitizeChatText } from "@/components/live/overlay/sanitize";
import { useLiveStore } from "@/components/live/overlay/store";
import { coerceAlertEvent } from "@/components/live/overlay/alert-parse";
import { WebRtcVideo, type WebRtcVideoState } from "@/components/live/overlay/webrtc-video";

import type { ChatMessage, Poll, StreamConfig } from "@/components/live/overlay/types";

type ClientMe = { id: string; username: string; avatarUrl?: string | null };

type ServerToClient = {
  "chat:history": (msgs: ChatMessage[]) => void;
  "chat:msg": (msg: ChatMessage) => void;
  "overlay:viewers": (n: number) => void;
  "overlay:alert": (e: unknown) => void;
  "overlay:poll": (p: Poll | null) => void;
  "overlay:reaction": (payload: { emoji: string }) => void;
};

type ClientToServer = {
  "room:join": (payload: { roomId: string; user: ClientMe | null }) => void;
  "chat:send": (payload: { roomId: string; text: string }) => void;
  "overlay:react": (payload: { roomId: string; key: string }) => void;
};

export function LiveStreamOverlayWebRtc(props: {
  stream: StreamConfig;
  me: ClientMe | null;
  videoEl: HTMLVideoElement | null;
  viewerQuality: "auto" | "low" | "med" | "high";
  onViewerQualityChange: (v: "auto" | "low" | "med" | "high") => void;
  className?: string;
}) {
  const [demoNow] = useState(() => Date.now());
  const isDesktop = useIsDesktop();

  const [theater, setTheater] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playerState, setPlayerState] = useState<WebRtcVideoState>({ s: "idle" });

  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Variants are not available on WebRTC. We still reuse the UI by mapping to fixed options.
  const variants = useMemo(
    () => [
      { index: -1, label: "Auto" },
      { index: 0, label: "Low" },
      { index: 1, label: "Medium" },
      { index: 2, label: "High" },
    ],
    []
  );
  const qualityValue: "auto" | number =
    props.viewerQuality === "auto" ? "auto" : props.viewerQuality === "low" ? 0 : props.viewerQuality === "med" ? 1 : 2;

  const socketRef = useRef<Socket<ServerToClient, ClientToServer> | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const {
    conn,
    setConn,
    viewerCount,
    setViewerCount,
    messages,
    setMessages,
    pushMessage,
    alerts,
    pushAlert,
    popAlert,
    poll,
    setPoll,
  } = useLiveStore();

  const [bursts, setBursts] = useState<Array<{ id: string; emoji: string }>>([]);

  const layout = useMemo(() => {
    if (!isDesktop) return "mobile";
    return theater ? "theater" : "standard";
  }, [isDesktop, theater]);

  useEffect(() => {
    const url = props.stream.chatWsUrl;
    if (!url) return;

    setConn("connecting");

    let didCancel = false;

    const socket: Socket<ServerToClient, ClientToServer> = io(url, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 400,
      reconnectionDelayMax: 2000,
      timeout: 8000,
    });

    socketRef.current = socket;

    // Add Supabase access token for server-side verification (enables chat send)
    void (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!didCancel && token) socket.auth = { token };
      } catch {
        // ignore
      }
    })();

    const join = () => {
      setConn("connected");
      socket.emit("room:join", { roomId: props.stream.roomId, user: props.me });
    };

    socket.on("connect", join);
    socket.on("disconnect", () => setConn("reconnecting"));
    socket.io.on("reconnect_attempt", () => setConn("reconnecting"));

    socket.on("chat:history", (msgs) => setMessages(msgs));
    socket.on("chat:msg", (msg) => pushMessage(msg));

    socket.on("overlay:viewers", (n) => setViewerCount(n));
    socket.on("overlay:alert", (e) => {
      const evt = coerceAlertEvent(e);
      if (evt) pushAlert(evt);
    });
    socket.on("overlay:poll", (p) => setPoll(p));
    socket.on("overlay:reaction", ({ emoji }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setBursts((prev) => [...prev, { id, emoji }].slice(-10));
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((x) => x.id !== id));
      }, 900);
    });

    if (reconnectTimerRef.current) window.clearInterval(reconnectTimerRef.current);
    reconnectTimerRef.current = window.setInterval(() => {
      if (alerts.length > 0) popAlert();
    }, 4200);

    return () => {
      didCancel = true;
      socket.disconnect();
      socketRef.current = null;
      if (reconnectTimerRef.current) window.clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.stream.chatWsUrl, props.stream.roomId]);

  const sendChat = async (text: string) => {
    const cleaned = sanitizeChatText(text);
    if (!cleaned) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("chat:send", { roomId: props.stream.roomId, text: cleaned });
  };

  const react = (key: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("overlay:react", { roomId: props.stream.roomId, key });
  };

  return (
    <div className={cn("relative", props.className)}>
      <div className={cn("relative overflow-hidden rounded-3xl border border-white/10 bg-black/30", layout === "mobile" && "rounded-2xl")}>
        <WebRtcVideo
          videoEl={props.videoEl}
          className={cn("absolute inset-0 h-full w-full object-cover", layout === "mobile" && "rounded-2xl")}
          muted={muted}
          onState={setPlayerState}
        />

        <StreamOverlays
          stream={props.stream}
          viewerCount={viewerCount}
          theater={theater}
          onToggleTheater={() => setTheater((v) => !v)}
          muted={muted}
          onToggleMuted={() => setMuted((v) => !v)}
          conn={conn}
        />

        <AlertStack alerts={alerts} />
        <BurstReactions bursts={bursts} />

        {/* Clickable host identity (top-left, under badges) */}
        {props.stream.host ? (
          <div className="absolute left-3 top-12">
            <HostPill host={props.stream.host} />
          </div>
        ) : null}

        {/* Mobile: floating chat + reactions */}
        <div className="absolute right-3 top-14 flex flex-col gap-2 lg:hidden">
          <MobileChatDrawer open={mobileChatOpen} onOpenChange={setMobileChatOpen}>
            <ChatPanel me={props.me} messages={messages} onSend={sendChat} className="h-full" />
          </MobileChatDrawer>

          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-auto">
            <div className="flex flex-col gap-2">
              <QualityMenu
                value={qualityValue}
                variants={variants as any}
                onChange={(v) => {
                  if (v === "auto" || v === -1) props.onViewerQualityChange("auto");
                  else if (v === 0) props.onViewerQualityChange("low");
                  else if (v === 1) props.onViewerQualityChange("med");
                  else props.onViewerQualityChange("high");
                }}
              />
              <ReactionBar onReact={react} compact />
            </div>
          </motion.div>
        </div>

        {/* Small status */}
        {playerState.s !== "playing" && (
          <div className="pointer-events-none absolute left-3 top-14">
            <Badge className="bg-black/55 text-white border-white/10">
              {playerState.s === "loading" ? "Buffering…" : playerState.s === "error" ? "Offline" : ""}
            </Badge>
          </div>
        )}

        <div className="pointer-events-none pb-[56.25%]" />
      </div>

      {/* Desktop chat sidebar */}
      {layout !== "mobile" && !theater ? (
        <div className="mt-3 grid grid-cols-[1fr_380px] gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{props.stream.title}</div>
                <div className="text-xs text-muted-foreground">Live</div>
              </div>
              <div className="flex items-center gap-2">
                <QualityMenu
                  value={qualityValue}
                  variants={variants as any}
                  onChange={(v) => {
                    if (v === "auto" || v === -1) props.onViewerQualityChange("auto");
                    else if (v === 0) props.onViewerQualityChange("low");
                    else if (v === 1) props.onViewerQualityChange("med");
                    else props.onViewerQualityChange("high");
                  }}
                />
                <ReactionBar onReact={react} />
              </div>
            </div>

            <div className="mt-3 grid gap-3">
              <PollCard
                poll={
                  poll ?? {
                    id: "demo",
                    question: "What should we build next?",
                    endsAt: demoNow + 120_000,
                    options: [
                      { id: "a", label: "Better emotes", votes: 14 },
                      { id: "b", label: "Drops / rewards", votes: 9 },
                      { id: "c", label: "Co-stream", votes: 6 },
                    ],
                  }
                }
              />
            </div>
          </div>

          <div className="min-h-[420px] rounded-2xl border border-white/10 bg-white/5">
            <ChatPanel me={props.me} messages={messages} onSend={sendChat} className="h-full" />
          </div>
        </div>
      ) : null}

      {/* subtle credit */}
      <Card className="mt-3 bg-transparent border-none shadow-none">
        <div className="text-[11px] text-muted-foreground">Realtime overlay powered by CrowdUnlock.</div>
      </Card>
    </div>
  );
}
