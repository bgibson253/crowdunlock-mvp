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

  // Create room + connect (no publish)
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

      // Pick the "best" remote video track (first subscribed)
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

    (async () => {
      try {
        setStatus((s) => ({ ...s, conn: "connecting" }));
        await room.connect(join.url, join.token);
        setStatus((s) => ({ ...s, conn: "connected" }));
      } catch (e: any) {
        setStatus((s) => ({ ...s, conn: "failed", err: e?.message ? String(e.message) : String(e) }));
      }
    })();

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

  const startPublishing = async () => {
    const room = roomRef.current;
    if (!room) {
      toast.error("Room not ready");
      return;
    }

    try {
      setStatus((s) => ({ ...s, pub: "requesting" }));

      // Must be called from a user gesture on iOS.
      const localTracks = await createLocalTracks({
        audio: true,
        video: {
          facingMode: "user",
          resolution: { width: 720, height: 1280 },
        },
      });

      const localVideo = localTracks.find((t) => t.kind === Track.Kind.Video);
      const localAudio = localTracks.find((t) => t.kind === Track.Kind.Audio);

      // Attach local preview to *prove* we have a track.
      // (This is not "fake" streaming; it validates device capture immediately.)
      if (localVideoElRef.current && localVideo) {
        localVideo.detach();
        localVideo.attach(localVideoElRef.current);
        localVideoElRef.current.muted = true;
        localVideoElRef.current.playsInline = true;
        // iOS sometimes needs explicit play
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

      // Attempt to unmute audio outputs for viewers; for hosts they are muted anyway.
      if (!join?.isHost && isIOS) {
        try {
          // Best-effort: user gesture already happened.
          await (room as any).startAudio?.();
        } catch {
          // ignore
        }
      }

      setStartNeeded(false);
      setStatus((s) => ({ ...s, pub: "published" }));
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      setStatus((s) => ({ ...s, pub: "failed", err: msg }));
      toast.error(`Publish failed: ${msg}`);
    }
  };

  if (!join) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground">
        Joining live…
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-black sm:rounded-xl sm:border sm:border-border/50">
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
              className="w-full rounded-full bg-white text-black px-5 py-3 text-sm font-semibold shadow"
              onClick={startPublishing}
            >
              {join.isHost ? "Go Live" : "Start audio"}
            </button>
            <div className="text-xs text-white/80">
              {join.isHost
                ? "This starts your camera/mic and publishes to LiveKit."
                : "iOS Safari requires a tap to start audio playback."}
            </div>
          </div>
        </div>
      ) : null}

      {/* TikTok overlay */}
      <LiveOverlay
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
