"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function useIsIOS() {
  return useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua);
  }, []);
}

type Props = {
  roomId: string;
  mode: "host" | "viewer";
};

type UiState =
  | "idle"
  | "connecting"
  | "live"
  | "waiting"
  | "reconnecting"
  | "ended"
  | "error";

export function LiveRoomSfu({ roomId, mode }: Props) {
  const isIOS = useIsIOS();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [ui, setUi] = useState<UiState>(() =>
    mode === "viewer" ? "connecting" : "idle"
  );
  const [attempt, setAttempt] = useState(0);
  const [lastErr, setLastErr] = useState<string | null>(null);

  const cleanup = () => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }
    wsRef.current = null;

    try {
      pcRef.current?.close();
    } catch {
      // ignore
    }
    pcRef.current = null;
  };

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleRetry = (ms: number) => {
    if (retryTimerRef.current) return;
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      setAttempt((a) => a + 1);
    }, ms);
  };

  const connect = async (asRole: "host" | "viewer") => {
    setLastErr(null);
    setUi((prev) => (prev === "live" ? "reconnecting" : "connecting"));

    const regionRes = await fetch("/api/live/region", { cache: "no-store" });
    const regionJson = await regionRes.json().catch(() => ({}));
    const region =
      regionRes.ok && (regionJson?.region === "usw2" || regionJson?.region === "use1")
        ? regionJson.region
        : "use1";

    const cfgRes = await fetch("/api/live/sfu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId, region }),
    });
    const cfg = await cfgRes.json().catch(() => ({}));
    if (!cfgRes.ok) throw new Error(cfg?.error ?? "Unable to start stream");

    cleanup();

    const pc = new RTCPeerConnection({
      iceServers: cfg.turn?.length
        ? cfg.turn
        : [{ urls: ["stun:stun.l.google.com:19302"] }],
    });
    pcRef.current = pc;

    // IMPORTANT: we must be ready to RECEIVE before we send the offer,
    // otherwise the server-viewer relay doesn't include stream IDs.
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState;
      if (st === "failed" || st === "disconnected") scheduleRetry(1200);
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.playsInline = true;
        remoteVideoRef.current.autoplay = true;
      }
      setUi("live");
    };

    const ws = new WebSocket(cfg.sfu.wsUrl);
    wsRef.current = ws;

    const send = (m: any) => ws.send(JSON.stringify(m));

    ws.onopen = async () => {
      if (asRole === "host") {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.playsInline = true;
          localVideoRef.current.autoplay = true;
          try {
            await localVideoRef.current.play();
          } catch {
            // ignore
          }
        }

        for (const track of stream.getTracks()) pc.addTrack(track, stream);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ t: "webrtc.offer", roomId, sdp: offer.sdp, type: offer.type });

        setUi("live");
      } else {
        send({ t: "viewer.ready", roomId });
      }
    };

    ws.onmessage = async (ev) => {
      const msg = JSON.parse(String(ev.data));

      if (msg.t === "webrtc.answer" && msg.sdp) {
        await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
        return;
      }

      if (msg.t === "webrtc.offer" && msg.sdp) {
        await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ t: "webrtc.answer", roomId, sdp: answer.sdp, type: answer.type });

        setUi("live");

        if (isIOS) {
          try {
            await remoteVideoRef.current?.play?.();
          } catch {
            // ignore
          }
        }
        return;
      }

      if (msg.t === "webrtc.ice" && msg.candidate) {
        try {
          await pc.addIceCandidate(msg.candidate);
        } catch {
          // ignore
        }
      }

      if (msg.t === "webrtc.offer.missing") {
        setUi("waiting");
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && ws.readyState === WebSocket.OPEN) {
        send({ t: "webrtc.ice", roomId, candidate: ev.candidate });
      }
    };

    ws.onerror = () => {
      setLastErr("Connection problem. Retrying…");
      scheduleRetry(1200);
    };

    ws.onclose = () => {
      if (asRole === "viewer") {
        setUi((prev) => (prev === "live" ? "reconnecting" : prev));
        scheduleRetry(1500);
      }
    };
  };

  useEffect(() => {
    if (mode !== "viewer") return;
    void connect("viewer").catch((e: any) => {
      setLastErr(e?.message ? String(e.message) : "Connection error");
      setUi("error");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, attempt]);

  const onHostStart = async () => {
    try {
      await connect("host");
    } catch (e: any) {
      setLastErr(e?.message ? String(e.message) : "Unable to start stream");
      setUi("error");
    }
  };

  const overlay = (() => {
    if (mode === "host" && ui === "idle") {
      return (
        <button
          onClick={onHostStart}
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white"
        >
          <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur">
            Go Live
          </span>
        </button>
      );
    }

    if (ui === "connecting") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
            Connecting…
          </div>
        </div>
      );
    }

    if (ui === "waiting") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
            Host is starting…
          </div>
        </div>
      );
    }

    if (ui === "reconnecting") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
            Reconnecting…
          </div>
        </div>
      );
    }

    if (ui === "error") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white">
          <div className="max-w-sm rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <div className="font-semibold">Stream unavailable</div>
            <div className="mt-1 text-white/80">Please try again.</div>
          </div>
        </div>
      );
    }

    return null;
  })();

  return (
    <div className="relative overflow-hidden bg-black sm:rounded-xl sm:border sm:border-border/50">
      <video
        ref={remoteVideoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        autoPlay
      />

      {mode === "host" ? (
        <video
          ref={localVideoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
      ) : null}

      {overlay}

      {lastErr ? (
        <div className="absolute left-2 top-2 rounded bg-black/55 px-2 py-1 text-[11px] text-white/80">
          {lastErr}
        </div>
      ) : null}

      <div className="pointer-events-none pb-[56.25%]" />
    </div>
  );
}
