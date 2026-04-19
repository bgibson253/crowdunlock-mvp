"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Room, RoomEvent, createLocalTracks, Track } from "livekit-client";
import { toast } from "sonner";

import { LiveOverlay } from "@/components/live/live-overlay";

type Props = {
  roomId: string;
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  hostUsername: string | null;
  currentUserId: string | null;
};

function useIsIOS() {
  return useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua);
  }, []);
}

export function LiveRoomManual({
  roomId,
  hostUserId,
  hostName,
  hostAvatarUrl,
  hostUsername,
  currentUserId,
}: Props) {
  const isIOS = useIsIOS();

  const [join, setJoin] = useState<{
    token: string;
    url: string;
    roomName: string;
    isHost: boolean;
  } | null>(null);

  const [status, setStatus] = useState<{
    conn: string;
    pub: string;
    err?: string;
  }>({ conn: "init", pub: "idle" });

  const roomRef = useRef<Room | null>(null);

  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);

  const [startNeeded, setStartNeeded] = useState(true);

  // Fetch token/url
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
        setJoin({ token: json.token, url: json.url, roomName: json.roomName, isHost: !!json.isHost });
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to join live");
      }
    })();
    return () => {
      canceled = true;
    };
  }, [roomId]);

  // Create room (do not auto-connect). iOS Safari is extremely picky about
  // user-gesture timing; connecting on load can lead to "engine not connected"
  // races when we later try to publish.
  useEffect(() => {
    if (!join) return;

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    const onConn = (cs: any) => {
      setStatus((s) => ({ ...s, conn: String(cs) }));
    };
    const onDisc = () => {
      const anyRoom: any = room as any;
      const last = anyRoom?.engine?.lastError ? String(anyRoom.engine.lastError) : undefined;
      setStatus((s) => ({ ...s, conn: "disconnected", err: last ?? s.err }));
    };

    const attachRemote = () => {
      const remoteEl = remoteVideoElRef.current;
      if (!remoteEl) return;

      for (const [, p] of room.remoteParticipants) {
        const pubs = Array.from(p.videoTrackPublications.values());
        for (const pub of pubs) {
          const t = pub.track;
          if (t && pub.isSubscribed) {
            try {
              t.detach();
              t.attach(remoteEl);
              return;
            } catch {
              // ignore
            }
          }
        }
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, onConn);
    room.on(RoomEvent.Disconnected, onDisc);
    room.on(RoomEvent.TrackSubscribed, attachRemote);
    room.on(RoomEvent.TrackUnsubscribed, attachRemote);
    room.on(RoomEvent.ParticipantConnected, attachRemote);
    room.on(RoomEvent.ParticipantDisconnected, attachRemote);

    setStatus((s) => ({ ...s, conn: "ready" }));

    return () => {
      try {
        room.removeAllListeners();
        room.disconnect();
      } catch {
        // ignore
      }
      roomRef.current = null;
    };
  }, [join]);

  const connectAndPublish = async () => {
    const room = roomRef.current;
    if (!room) {
      toast.error("Room not ready");
      return;
    }

    try {
      setStatus((s) => ({ ...s, pub: "requesting", err: undefined }));

      // If we aren't connected yet, connect first (on iOS this still counts as the
      // same user gesture since this function is called from a tap).
      if ((room as any).state !== "connected") {
        if (!join) throw new Error("Join info missing");
        setStatus((s) => ({ ...s, conn: "connecting" }));
        await room.connect(join.url, join.token);
        setStatus((s) => ({ ...s, conn: "connected" }));
      }

      if (join?.isHost) {
        // Must be called from a user gesture on iOS.
        const localTracks = await createLocalTracks({
          audio: true,
          video: {
            facingMode: "user",
            resolution: { width: 720, height: 1280 },
          },
        });

        const localVideo = localTracks.find((t) => t.kind === Track.Kind.Video);

        // Attach local preview immediately.
        if (localVideoElRef.current && localVideo) {
          localVideo.detach();
          localVideo.attach(localVideoElRef.current);
          localVideoElRef.current.muted = true;
          localVideoElRef.current.playsInline = true;
          try {
            await localVideoElRef.current.play();
          } catch {
            // ignore
          }
        }

        setStatus((s) => ({ ...s, pub: "publishing" }));
        for (const t of localTracks) {
          await room.localParticipant.publishTrack(t);
        }

        setStartNeeded(false);
        setStatus((s) => ({ ...s, pub: "published" }));
      } else {
        // Viewer: don't try to capture camera/mic. Just unlock audio playback on iOS.
        setStatus((s) => ({ ...s, pub: "starting-audio" }));
        if (isIOS) {
          try {
            await (room as any).startAudio?.();
          } catch {
            // ignore
          }
        }
        setStartNeeded(false);
        setStatus((s) => ({ ...s, pub: "watching" }));
      }
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      setStatus((s) => ({ ...s, pub: "failed", err: msg }));
      toast.error(`Publish failed: ${msg}`);
    }
  };

  const startPublishing = async () => {
    // Legacy alias (kept because button handler references it)
    return connectAndPublish();
  };

  if (!join) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground">
        Joining live…
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden bg-black sm:rounded-xl sm:border sm:border-border/50"
      onClickCapture={() => {
        // If the Go Live button becomes unclickable on iOS Safari, any tap will start.
        if (startNeeded) void connectAndPublish();
      }}
    >
      {/* Video surface */}
      <div ref={videoWrapRef} className="fixed inset-0 sm:static sm:inset-auto">
        {/* Remote video fills screen for viewers */}
        <video
          ref={remoteVideoElRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted={false}
          autoPlay
        />

        {/* Local video preview for host (and as fallback). */}
        <video
          ref={localVideoElRef}
          className={
            join.isHost
              ? "absolute inset-0 h-full w-full object-cover"
              : "absolute right-3 bottom-20 h-28 w-20 rounded-lg border border-white/10 object-cover opacity-0"
          }
          playsInline
          muted
          autoPlay
        />
      </div>

      {/* Hard status HUD */}
      <div className="pointer-events-none absolute top-14 left-3 z-50 text-[11px] text-white/90">
        <div className="rounded-full bg-black/45 backdrop-blur border border-white/10 px-2 py-1">
          conn: {status.conn} · pub: {status.pub}
          {status.err ? ` · err: ${status.err}` : ""}
        </div>
      </div>

      {/* Start overlay */}
      {startNeeded ? (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm space-y-3">
            <button
              type="button"
              className="w-full rounded-full bg-white text-black px-5 py-3 text-sm font-semibold shadow active:scale-[0.99]"
              onClick={startPublishing}
            >
              {join.isHost ? "Go Live" : "Watch live"}
            </button>

            {/* Emergency escape hatch if iOS pointer events get weird. */}
            <button
              type="button"
              className="w-full rounded-full bg-white/10 text-white px-5 py-3 text-sm font-semibold border border-white/15"
              onClick={() => {
                setStartNeeded(false);
              }}
            >
              Dismiss
            </button>

            <div className="text-xs text-white/80">
              {join.isHost
                ? "Tap Go Live to connect + publish your camera/mic."
                : "iOS Safari requires a tap to start audio playback."}
            </div>
          </div>
        </div>
      ) : null}

      {/* TikTok overlay */}
      <LiveOverlay
        roomRef={roomRef}
        hostUserId={hostUserId}
        hostName={hostName}
        hostAvatarUrl={hostAvatarUrl}
        hostUsername={hostUsername}
        currentUserId={currentUserId}
        liveRoomId={roomId}
      />
    </div>
  );
}
