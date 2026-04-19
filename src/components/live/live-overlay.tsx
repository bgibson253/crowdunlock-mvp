"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import type { Room, RemoteParticipant } from "livekit-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOff, Send } from "lucide-react";
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
}: {
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  hostUsername: string | null;
  currentUserId: string | null;
}) {
  const room = useRoomContext() as Room;
  const [hidden, setHidden] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

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
      if (!obj || obj?.t !== "chat") return;
      const next: ChatMsg = {
        id: crypto.randomUUID(),
        at: Date.now(),
        fromName: String(obj?.fromName ?? "Someone"),
        fromUserId: typeof obj?.fromUserId === "string" ? obj.fromUserId : undefined,
        text: String(obj?.text ?? "").slice(0, 300),
      };
      setMsgs((prev) => [...prev.slice(-49), next]);
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
      {/* Top-left host avatar chip */}
      <div className="pointer-events-auto absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur px-2 py-1 border border-white/10">
        <a href={`/profile/${hostUserId}`} className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-2 ring-red-500/70">
            {hostAvatarUrl ? <AvatarImage src={hostAvatarUrl} alt={hostName} /> : null}
            <AvatarFallback className="text-xs">{hostName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-white">{hostName}</div>
            <div className="text-[10px] text-white/70">LIVE</div>
          </div>
        </a>

        {/* Follow / Friend quick actions */}
        {currentUserId && currentUserId !== hostUserId && (
          <div className="flex items-center gap-1 ml-1">
            <FollowButton targetUserId={hostUserId} currentUserId={currentUserId} isFollowing={false} compact />
            <FriendButton targetUserId={hostUserId} currentUserId={currentUserId} compact />
          </div>
        )}
      </div>

      {/* Hide comments toggle */}
      <div className="pointer-events-auto absolute top-3 right-3">
        <Button
          size="sm"
          variant="outline"
          className="h-8 bg-black/40 text-white border-white/10 hover:bg-black/55"
          onClick={() => setHidden((v) => !v)}
        >
          <EyeOff className="h-4 w-4 mr-1" />
          {hidden ? "Show" : "Hide"}
        </Button>
      </div>

      {/* Bottom overlay: comments */}
      {!hidden && (
        <div className="pointer-events-auto absolute bottom-14 left-3 right-3 sm:right-auto sm:w-[420px]">
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

      {/* Tip button placeholder (wired next) */}
      <div className="pointer-events-auto absolute bottom-3 right-3">
        <Button size="sm" className="h-10 rounded-full shadow-lg" disabled title="Tips coming next">
          Tip
        </Button>
      </div>
    </div>
  );
}
