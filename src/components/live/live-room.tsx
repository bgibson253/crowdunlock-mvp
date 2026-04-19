"use client";

import "@livekit/components-styles";

import { useEffect, useMemo, useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  FocusLayout,
  ParticipantTile,
  ControlBar,
  StartAudio,
  useTracks,
  useRoomContext,
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

function EnableDevicesOnConnect({ enabled }: { enabled: boolean }) {
  const room = useRoomContext() as any;

  useEffect(() => {
    if (!room) return;
    if (!enabled) return;

    // Attempt to enable devices once connected.
    let did = false;
    const handler = () => {
      if (did) return;
      did = true;
      try {
        room?.localParticipant?.setCameraEnabled(true);
        room?.localParticipant?.setMicrophoneEnabled(true);
      } catch {
        // best-effort
      }
    };

    room.on?.("connected", handler);
    handler();

    return () => {
      room.off?.("connected", handler);
    };
  }, [room, enabled]);

  return null;
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

function DebugPublishBadge() {
  const room = useRoomContext() as any;
  const [status, setStatus] = useState<{
    cam: boolean;
    mic: boolean;
    conn: string;
    err?: string;
  }>({ cam: false, mic: false, conn: "" });

  useEffect(() => {
    if (!room) return;

    const update = () => {
      const lp = room?.localParticipant;
      const cam = !!lp?.isCameraEnabled;
      const mic = !!lp?.isMicrophoneEnabled;
      const conn = String(room?.state ?? "");
      const err = room?.engine?.lastError ? String(room.engine.lastError) : undefined;
      setStatus({ cam, mic, conn, err });
    };

    update();
    room.on?.("localTrackPublished", update);
    room.on?.("localTrackUnpublished", update);
    room.on?.("trackSubscribed", update);
    room.on?.("connectionStateChanged", update);
    room.on?.("disconnected", update);
    room.on?.("reconnecting", update);
    room.on?.("reconnected", update);

    return () => {
      room.off?.("localTrackPublished", update);
      room.off?.("localTrackUnpublished", update);
      room.off?.("trackSubscribed", update);
      room.off?.("connectionStateChanged", update);
    };
  }, [room]);

  return (
    <div className="pointer-events-none absolute top-14 left-3 z-50 text-[11px] text-white/90">
      <div className="rounded-full bg-black/40 backdrop-blur border border-white/10 px-2 py-1">
        conn: {status.conn} · cam: {status.cam ? "on" : "off"} · mic: {status.mic ? "on" : "off"}
        {status.err ? ` · err: ${status.err}` : ""}
      </div>
    </div>
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
  const [startNeeded, setStartNeeded] = useState(true);
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

        // Try to verify we can access devices right now (gives clearer iOS failures).
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setCameraOk(stream.getVideoTracks().length > 0);
          setMicOk(stream.getAudioTracks().length > 0);
          stream.getTracks().forEach((t) => t.stop());
        } catch (e: any) {
          setCameraOk(false);
          setMicOk(false);
          console.error("getUserMedia failed", e);
        }
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
        // Don’t auto-toggle devices on mount; we explicitly enable below.
        video={false}
        audio={false}
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

        {startNeeded ? (
          <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <button
              type="button"
              className="rounded-full bg-white text-black px-5 py-3 text-sm font-semibold shadow"
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                  setCameraOk(stream.getVideoTracks().length > 0);
                  setMicOk(stream.getAudioTracks().length > 0);
                  stream.getTracks().forEach((t) => t.stop());

                  // Now allow LiveKit enable flow.
                  setStartNeeded(false);
                } catch (e: any) {
                  const name = e?.name ? String(e.name) : "PermissionError";
                  const msg = e?.message ? String(e.message) : "";
                  toast.error(`Camera/mic blocked (${name})${msg ? `: ${msg}` : ""}`);
                }
              }}
            >
              Start camera
            </button>
            <div className="absolute bottom-6 left-6 right-6 text-xs text-white/80">
              iOS Safari requires a tap to start realtime audio/video.
            </div>
          </div>
        ) : null}

        <EnableDevicesOnConnect enabled={!startNeeded} />
        <DebugPublishBadge />

        {/* iOS/Safari requires a user gesture to start audio playback.
            TikTok-style: hide it for hosts; show a styled prompt for viewers. */}
        {!isHost ? (
          <div className="pointer-events-auto fixed inset-0 sm:absolute sm:inset-0 flex items-center justify-center z-40">
            <StartAudio
              label="Tap to start audio"
              className="rounded-full bg-black/55 text-white border border-white/10 px-4 py-2"
            />
          </div>
        ) : null}

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
