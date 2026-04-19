"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import type { Room, RemoteParticipant } from "livekit-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOff, Send, X } from "lucide-react";
import { FriendButton } from "@/components/social/friend-button";
import { FollowButton } from "@/components/social/follow-button";
import { toast } from "sonner";

type ChatMsg = {
  id: string;
  at: number;
  fromName: string;
  fromUserId?: string;
  text: string;
};

function parseJson(data: Uint8Array): any {
  try {
    const str = new TextDecoder().decode(data);
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function LiveOverlay({
  hostUserId,
  hostName,
  hostAvatarUrl,
  hostUsername,
  currentUserId,
  liveRoomId,
}: {
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  hostUsername: string | null;
  currentUserId: string | null;
  liveRoomId: string;
}) {
  const room = useRoomContext() as Room;
  const [hidden, setHidden] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [profileTapAt, setProfileTapAt] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [textTip, setTextTip] = useState("5");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  // TikTok-style hearts (local-only for now)
  const [hearts, setHearts] = useState<Array<{ id: string; left: number; createdAt: number }>>([]);
  const startYRef = useRef<number | null>(null);

  const canChat = !!currentUserId;

  const hostIdentity = useMemo(() => {
    // We encode hostUserId in token identity (api/live/token route) in our impl.
    // So this should match participant.identity when host is connected.
    return hostUserId;
  }, [hostUserId]);

  const hostParticipant: RemoteParticipant | undefined = useMemo(() => {
    if (!room) return undefined;
    const rp = room.remoteParticipants.get(hostIdentity) as any;
    return rp ?? undefined;
  }, [room, hostIdentity, msgs.length]);

  useEffect(() => {
    if (!room) return;

    function onData(payload: Uint8Array) {
      const obj = parseJson(payload);
      if (!obj) return;

      if (obj?.t === "chat") {
        const next: ChatMsg = {
          id: crypto.randomUUID(),
          at: Date.now(),
          fromName: String(obj?.fromName ?? "Someone"),
          fromUserId: typeof obj?.fromUserId === "string" ? obj.fromUserId : undefined,
          text: String(obj?.text ?? "").slice(0, 300),
        };
        setMsgs((prev) => [...prev.slice(-49), next]);
        return;
      }

      if (obj?.t === "tip") {
        const dollars = typeof obj?.amountCents === "number" ? (obj.amountCents / 100).toFixed(2) : "";
        toast.success(`Tip received: $${dollars}`);
        return;
      }
    }

    room.on("dataReceived", onData);
    return () => {
      room.off("dataReceived", onData);
    };
  }, [room]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs.length]);

  // cleanup hearts
  useEffect(() => {
    if (hearts.length === 0) return;
    const t = setInterval(() => {
      const cutoff = Date.now() - 1400;
      setHearts((prev) => prev.filter((h) => h.createdAt > cutoff));
    }, 250);
    return () => clearInterval(t);
  }, [hearts.length]);

  async function sendChat() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!room?.localParticipant) return;

    try {
      const payload = {
        t: "chat",
        text: trimmed,
        fromUserId: currentUserId,
        fromName: "You",
      };
      const bytes = new TextEncoder().encode(JSON.stringify(payload));
      await room.localParticipant.publishData(bytes, { reliable: true });

      setMsgs((prev) => [
        ...prev.slice(-49),
        {
          id: crypto.randomUUID(),
          at: Date.now(),
          fromName: "You",
          fromUserId: currentUserId ?? undefined,
          text: trimmed,
        },
      ]);
      setText("");
    } catch {
      toast.error("Failed to send message");
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Hearts (local-only animation) */}
      <div className="pointer-events-none absolute inset-0">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute bottom-20 text-pink-500 text-2xl"
            style={{
              left: h.left,
              animation: "cuFloatHeart 1.2s ease-out forwards",
              filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.4))",
            }}
          >
            ♥
          </div>
        ))}
      </div>

      {/* Tap anywhere to toggle chrome; swipe down to exit; tap right side for hearts. */}
      <button
        type="button"
        aria-label="Toggle overlay"
        className="pointer-events-auto absolute inset-0"
        onPointerDown={(e) => {
          startYRef.current = e.clientY;
        }}
        onPointerUp={(e) => {
          const startY = startYRef.current;
          startYRef.current = null;
          const dy = startY == null ? 0 : e.clientY - startY;

          // Swipe down to exit
          if (dy > 80) {
            window.history.back();
            return;
          }

          // Right-side tap => hearts
          const x = e.clientX;
          const w = window.innerWidth || 1;
          const isRightSide = x > w * 0.62;
          if (isRightSide) {
            const left = Math.max(w * 0.55, Math.min(w - 40, x));
            setHearts((prev) => [
              ...prev.slice(-29),
              { id: crypto.randomUUID(), left, createdAt: Date.now() },
            ]);
            return;
          }

          // Otherwise just toggle chrome
          setChromeHidden((v) => !v);
        }}
      />
      {/* Top-left host header (TikTok-ish) */}
      <style>{`
        @keyframes cuFloatHeart {
          0% { transform: translateY(0) scale(0.9); opacity: 0.0; }
          10% { opacity: 1; }
          100% { transform: translateY(-140px) scale(1.25); opacity: 0; }
        }
      `}</style>

      <div
        className={`pointer-events-auto absolute top-3 left-3 right-3 flex items-center justify-between transition-opacity duration-200 ${
          chromeHidden ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur px-2 py-1 border border-white/10">
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={() => {
            // Don’t navigate on accidental taps.
            // Double-tap within 1.2s to open host profile.
            const now = Date.now();
            setProfileTapAt((prev) => {
              if (prev && now - prev < 1200) {
                window.location.href = `/profile/${hostUserId}`;
                return null;
              }
              toast.message("Tap again to view profile");
              return now;
            });
          }}
        >
          <Avatar className="h-8 w-8 ring-2 ring-red-500/70">
            {hostAvatarUrl ? <AvatarImage src={hostAvatarUrl} alt={hostName} /> : null}
            <AvatarFallback className="text-xs">{hostName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-white">{hostName}</div>
            <div className="text-[10px] text-white/70">LIVE</div>
          </div>
        </button>

        {/* Follow / Friend quick actions */}
        {currentUserId && currentUserId !== hostUserId && (
          <div className="flex items-center gap-1 ml-1">
            <FollowButton targetUserId={hostUserId} currentUserId={currentUserId} isFollowing={false} compact />
            <FriendButton targetUserId={hostUserId} currentUserId={currentUserId} compact />
          </div>
        )}
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full bg-red-500/90 text-white text-[11px] font-semibold px-2 py-1">LIVE</div>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-black/40 text-white border-white/10 hover:bg-black/55"
            onClick={(e) => {
              e.stopPropagation();
              window.history.back();
            }}
            aria-label="Close live"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 bg-black/40 text-white border-white/10 hover:bg-black/55"
            onClick={(e) => {
              e.stopPropagation();
              setHidden((v) => !v);
            }}
          >
            <EyeOff className="h-4 w-4 mr-1" />
            {hidden ? "Show" : "Hide"}
          </Button>
        </div>
      </div>

      {/* Bottom overlay: comments */}
      {!hidden && (
        <div
          className={`pointer-events-auto absolute bottom-16 left-3 right-3 sm:right-auto sm:w-[420px] transition-opacity duration-200 ${
            chromeHidden ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="rounded-2xl bg-black/35 backdrop-blur border border-white/10 overflow-hidden">
            <div ref={listRef} className="max-h-[34vh] overflow-y-auto px-3 py-2 space-y-1">
              {msgs.length === 0 ? (
                <div className="text-xs text-white/70 py-2">Be the first to comment</div>
              ) : (
                msgs.map((m) => (
                  <div key={m.id} className="text-xs text-white/90">
                    <span className="font-semibold">{m.fromName}: </span>
                    <span className="text-white/90">{m.text}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 p-2 border-t border-white/10">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendChat();
                }}
                placeholder={canChat ? "Add a comment…" : "Sign in to chat"}
                disabled={!canChat}
                className="h-9 bg-black/25 border-white/10 text-white placeholder:text-white/50"
              />
              <Button
                size="sm"
                onClick={sendChat}
                disabled={!canChat || !text.trim()}
                className="h-9"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Right rail actions (TikTok-ish) */}
      <div
        className={`pointer-events-auto absolute bottom-3 right-3 flex flex-col items-end gap-2 transition-opacity duration-200 ${
          chromeHidden ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="rounded-2xl bg-black/35 backdrop-blur border border-white/10 p-2 flex items-center gap-2">
          <Input
            value={textTip}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              setTextTip(v);
            }}
            inputMode="decimal"
            placeholder="$5"
            className="h-9 w-[88px] bg-black/25 border-white/10 text-white placeholder:text-white/50"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            size="sm"
            className="h-9 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              (async () => {
                if (!currentUserId || !hostUsername) {
                  toast.error("Sign in to tip");
                  return;
                }
                const raw = parseFloat(textTip || "5");
                const amount = Number.isFinite(raw) && raw > 0 ? raw : 5;
                const res = await fetch("/api/stripe/checkout/live-tip", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    host_user_id: hostUserId,
                    host_username: hostUsername,
                    live_room_id: liveRoomId,
                    amount,
                  }),
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json?.url) {
                  toast.error(json?.error ?? "Failed to start tip checkout");
                  return;
                }
                window.location.href = json.url;
              })();
            }}
          >
            Tip
          </Button>
        </div>
      </div>
    </div>
  );
}
