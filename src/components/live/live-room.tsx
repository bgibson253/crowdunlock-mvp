"use client";

import "@livekit/components-styles";

import { useEffect, useMemo, useState } from "react";
import { LiveKitRoom, FocusLayout, ParticipantTile, ControlBar } from "@livekit/components-react";
import { toast } from "sonner";

export function LiveRoom({ roomId }: { roomId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(`/api/live/token`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "Failed to get token");
        if (canceled) return;
        setToken(json.token);
        setUrl(json.url);
        setRoomName(json.roomName);
        setIsHost(!!json.isHost);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to join live");
      }
    })();
    return () => {
      canceled = true;
    };
  }, [roomId]);

  const connectOptions = useMemo(() => ({ autoSubscribe: true }), []);

  if (!token || !url || !roomName) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground">
        Joining live…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connectOptions={connectOptions}
        video
        audio
        data-lk-theme="default"
        style={{ height: "70vh" }}
      >
        <div className="p-2 border-b border-border/50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {isHost ? "You are live" : "Watching live"}
          </div>
          <div className="text-xs font-medium text-red-400">LIVE</div>
        </div>

        <FocusLayout style={{ height: "calc(70vh - 92px)" }}>
          <ParticipantTile />
        </FocusLayout>

        <div className="border-t border-border/50">
          <ControlBar />
        </div>
      </LiveKitRoom>
    </div>
  );
}
