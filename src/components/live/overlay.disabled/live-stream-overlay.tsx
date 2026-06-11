"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { HlsPlayer, type PlayerState, type HlsVariant } from "@/components/live/overlay/hls-player";
import { QualityMenu } from "@/components/live/overlay/quality-menu";
import { ChatPanel } from "@/components/live/overlay/chat-panel";
import { MobileChatDrawer } from "@/components/live/overlay/mobile-chat-drawer";
import { PollCard } from "@/components/live/overlay/polls";
import { ReactionBar, BurstReactions } from "@/components/live/overlay/reactions";
import { AlertStack, StreamOverlays } from "@/components/live/overlay/overlays";
import { useIsDesktop } from "@/components/live/overlay/use-media-query";
import { sanitizeChatText } from "@/components/live/overlay/sanitize";
import { useLiveStore } from "@/components/live/overlay/store";
import { coerceAlertEvent } from "@/components/live/overlay/alert-parse";

import type { AlertEvent, ChatMessage, Poll, StreamConfig } from "@/components/live/overlay/types";

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

export function LiveStreamOverlay(props: {
  stream: StreamConfig;
  me: ClientMe | null;
  className?: string;
}) {
  const [demoNow] = useState(() => Date.now());
  const isDesktop = useIsDesktop();

  const [theater, setTheater] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>({ s: "idle" });

  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [variants, setVariants] = useState<HlsVariant[]>([]);
  const [quality, setQuality] = useState<"auto" | number>("auto");

  const socketRef = useRef<Socket<ServerToClient, ClientToServer> | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const { conn, setConn, viewerCount, setViewerCount, messages, setMessages, pushMessage, alerts, pushAlert, popAlert, poll, setPoll } =
    useLiveStore();

  const [bursts, setBursts] = useState<Array<{ id: string; emoji: string }>>([]);

  const layout = useMemo(() => {
    if (!isDesktop) return "mobile";
    return theater ? "theater" : "standard";
  }, [isDesktop, theater]);

  // Socket.io realtime
  useEffect(() => {
    const url = props.stream.chatWsUrl;
    if (!url) return;

    setConn("connecting");

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

    // Auto-pop alerts
    if (reconnectTimerRef.current) window.clearInterval(reconnectTimerRef.current);
    reconnectTimerRef.current = window.setInterval(() => {
      if (alerts.length > 0) popAlert();
    }, 3200);

    return () => {
      try {
        socket.disconnect();
      } catch {}
      socketRef.current = null;
      if (reconnectTimerRef.current) window.clearInterval(reconnectTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.stream.chatWsUrl, props.stream.roomId, props.me?.id]);

  const sendChat = (text: string) => {
    const clean = sanitizeChatText(text);
    if (!clean) return;

    // optimistic local echo
    if (props.me) {
      pushMessage({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        roomId: props.stream.roomId,
        user: { id: props.me.id, username: props.me.username, avatarUrl: props.me.avatarUrl ?? null },
        text: clean,
        createdAt: Date.now(),
      });
    }

    socketRef.current?.emit("chat:send", { roomId: props.stream.roomId, text: clean });
  };

  const react = (key: string) => {
    socketRef.current?.emit("overlay:react", { roomId: props.stream.roomId, key });
  };

  return (
    <div className={cn("w-full", props.className)}>
      <div
        className={cn(
          "mx-auto w-full max-w-[1400px] px-3 py-3",
          layout === "mobile" ? "" : "lg:px-6 lg:py-6"
        )}
      >
        {/* Top bar (desktop) */}
        <div className="hidden lg:flex items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold">{props.stream.title}</div>
            <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-300/20">
              LIVE
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <ReactionBar onReact={react} />
            <QualityMenu value={quality} variants={variants} onChange={setQuality} />
            <Button
              variant="secondary"
              className="bg-white/5 border border-white/10 hover:bg-white/10"
              onClick={() => setTheater((v) => !v)}
            >
              {theater ? "Exit theater" : "Theater"}
            </Button>
          </div>
        </div>

        {/* Main grid */}
        <div
          className={cn(
            "grid min-h-[70dvh] gap-3",
            layout === "mobile" && "grid-cols-1",
            layout !== "mobile" && "grid-cols-[1fr_380px]",
            theater && "grid-cols-1"
          )}
        >
          {/* Video area */}
          <div className={cn("relative min-h-[56dvh]", layout !== "mobile" && "min-h-[72dvh]")}
          >
            <HlsPlayer
              src={props.stream.hlsUrl}
              className={cn("h-full", layout === "mobile" && "rounded-xl")}
              muted={muted}
              quality={quality}
              onVariants={setVariants}
              onQualityChange={setQuality}
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

            {/* Mobile: floating chat + reactions */}
            <div className="absolute right-3 top-14 flex flex-col gap-2 lg:hidden">
              <MobileChatDrawer open={mobileChatOpen} onOpenChange={setMobileChatOpen}>
                <ChatPanel me={props.me} messages={messages} onSend={sendChat} className="h-full" />
              </MobileChatDrawer>

              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-auto"
              >
                <div className="flex flex-col gap-2">
                  <QualityMenu value={quality} variants={variants} onChange={setQuality} />
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
          </div>

          {/* Desktop chat sidebar */}
          {layout !== "mobile" && !theater && (
            <div className="hidden lg:flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5">
              <ChatPanel me={props.me} messages={messages} onSend={sendChat} className="h-full" />
            </div>
          )}
        </div>

        {/* Below video: extras */}
        <div className={cn("mt-3 grid gap-3", layout === "mobile" ? "grid-cols-1" : "grid-cols-3")}
        >
          <Card className="border-white/10 bg-white/5 p-3">
            <div className="text-sm font-semibold">Stream controls</div>
            <div className="mt-1 text-sm text-muted-foreground">
              ABR + low-latency HLS via hls.js. PiP-ready (native player).
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="bg-white/5 border border-white/10 hover:bg-white/10"
                onClick={() => {
                  const v = document.querySelector("video");
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (v as any)?.requestPictureInPicture?.();
                }}
              >
                Picture-in-picture
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setMuted(false)}
              >
                Unmute
              </Button>
            </div>
          </Card>

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

          <Card className="border-white/10 bg-white/5 p-3">
            <div className="text-sm font-semibold">Safety</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Chat is sanitized. Add rate limits + auth on server.
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Placeholder: profanity filter + mod actions.
            </div>
          </Card>
        </div>

        {/* Mobile: chat hint */}
        <div className="mt-3 lg:hidden text-xs text-muted-foreground">
          Chat is a bottom sheet — it won’t crush the video in portrait.
        </div>
      </div>
    </div>
  );
}
