"use client";

import "@livekit/components-styles";

import { useEffect, useMemo, useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  FocusLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { toast } from "sonner";

import { LiveOverlay } from "@/components/live/live-overlay";

function HostStage() {
  const tracks = useTracks([
    {
      source: Track.Source.Camera,
      withPlaceholder: true,
      // Ensure we include the local camera track explicitly.
      // (Host must always see themselves.)
      participant: "local",
    },
    { source: Track.Source.Microphone, withPlaceholder: false, participant: "local" },
  ]);

  return (
    <GridLayout
      tracks={tracks}
      className="h-[100dvh] w-[100vw] sm:h-[calc(70vh-92px)] sm:w-auto"
      style={{ height: "100dvh" }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}

function ViewerStage() {
  return (
    <FocusLayout
      className="h-[100dvh] w-[100vw] sm:h-[calc(70vh-92px)] sm:w-auto"
      style={{ height: "100dvh" }}
    >
      <ParticipantTile />
    </FocusLayout>
  );
}

export function LiveRoom({
  roomId,
  hostUserId,
  hostName,
  hostAvatarUrl,
  hostUsername,
  currentUserId,
}: {
  roomId: string;
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  hostUsername: string | null;
  currentUserId: string | null;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // quick permission sanity check (especially on iOS Safari)
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraOk(stream.getVideoTracks().length > 0);
        setMicOk(stream.getAudioTracks().length > 0);
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setCameraOk(false);
        setMicOk(false);
      }
    })();
  }, []);

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
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground space-y-2">
        <div>Joining live…</div>
        {cameraOk === false || micOk === false ? (
          <div className="text-xs text-destructive">
            Camera/mic blocked in this browser. iOS: Settings → Safari → Camera/Microphone → Allow.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-black sm:rounded-xl sm:border sm:border-border/50 sm:bg-card/50">
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connectOptions={connectOptions}
        video
        audio
        data-lk-theme="default"
        className="h-[100dvh] w-[100vw] sm:h-auto sm:w-auto"
        style={{ height: "100dvh" }}
      >
        {/* Hide the header on mobile (TikTok-style). Keep on desktop. */}
        <div className="hidden sm:flex p-2 border-b border-border/50 items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {isHost ? "You are live" : "Watching live"}
          </div>
          <div className="text-xs font-medium text-red-400">LIVE</div>
        </div>

        <div className="fixed inset-0 sm:static sm:inset-auto">
          {isHost ? <HostStage /> : <ViewerStage />}
        </div>

        <LiveOverlay
          hostUserId={hostUserId}
          hostName={hostName}
          hostAvatarUrl={hostAvatarUrl}
          hostUsername={hostUsername}
          currentUserId={currentUserId}
          liveRoomId={roomId}
        />

        <div className="border-t border-border/50">
          <ControlBar />
        </div>
      </LiveKitRoom>
    </div>
  );
}
