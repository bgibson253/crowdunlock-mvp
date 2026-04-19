"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

export function LiveRoomSfu({ roomId, mode }: Props) {
  const isIOS = useIsIOS();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [status, setStatus] = useState<{ step: string; err?: string }>(() => ({
    step: "ready",
  }));

  useEffect(() => {
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
    };
  }, []);

  const connect = async () => {
    setStatus({ step: "loading" });

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
    if (!cfgRes.ok) throw new Error(cfg?.error ?? "Failed to fetch SFU config");

    const pc = new RTCPeerConnection({
      iceServers: cfg.turn?.length
        ? cfg.turn
        : [{ urls: ["stun:stun.l.google.com:19302"] }],
    });
    pcRef.current = pc;

    pc.oniceconnectionstatechange = () => {
      setStatus((s) => ({ ...s, step: `ice:${pc.iceConnectionState}` }));
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.playsInline = true;
        remoteVideoRef.current.autoplay = true;
      }
    };

    const ws = new WebSocket(cfg.sfu.wsUrl);
    wsRef.current = ws;

    const send = (m: any) => ws.send(JSON.stringify(m));

    ws.onopen = async () => {
      setStatus({ step: "ws:open" });

      if (mode === "host") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.playsInline = true;
          localVideoRef.current.autoplay = true;
          try {
            await localVideoRef.current.play();
          } catch {}
        }

        for (const track of stream.getTracks()) pc.addTrack(track, stream);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ t: "webrtc.offer", roomId, sdp: offer.sdp, type: offer.type });
      } else {
        // Viewer
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
        // viewer receiving offer
        await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ t: "webrtc.answer", roomId, sdp: answer.sdp, type: answer.type });

        if (isIOS) {
          // iOS Safari often needs an explicit user gesture to start audio. We'll
          // surface a tap-to-unmute overlay if autoplay fails.
          setStatus((s) => ({ ...s, step: "watching" }));
        }
        return;
      }

      if (msg.t === "webrtc.ice" && msg.candidate) {
        try {
          await pc.addIceCandidate(msg.candidate);
        } catch {}
      }

      if (msg.t === "webrtc.offer.missing") {
        setStatus({ step: "waiting_for_host" });
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && ws.readyState === WebSocket.OPEN) {
        send({ t: "webrtc.ice", roomId, candidate: ev.candidate });
      }
    };

    ws.onerror = () => {
      toast.error("Streaming connection error");
      setStatus({ step: "ws:error" });
    };

    ws.onclose = () => {
      setStatus({ step: "ws:closed" });
    };
  };

  const start = async () => {
    try {
      await connect();
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      setStatus({ step: "error", err: msg });
      toast.error(msg);
    }
  };

  return (
    <div className="relative overflow-hidden bg-black sm:rounded-xl sm:border sm:border-border/50">
      {/* Remote video (viewer) */}
      <video
        ref={remoteVideoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        autoPlay
      />

      {/* Host local preview */}
      {mode === "host" ? (
        <video
          ref={localVideoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
      ) : null}

      {/* UX overlays */}
      {mode === "host" && status.step === "ready" ? (
        <button
          onClick={start}
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white"
        >
          <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur">
            Start stream
          </span>
        </button>
      ) : null}

      {mode === "viewer" && status.step === "waiting_for_host" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
            Waiting for host to go live…
          </div>
        </div>
      ) : null}

      {status.step === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
          <div className="max-w-sm rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <div className="font-semibold">Stream error</div>
            <div className="mt-1 text-white/80">{status.err}</div>
          </div>
        </div>
      ) : null}

      {/* Tiny debug (test mode only) */}
      {process.env.NEXT_PUBLIC_APP_URL && process.env.TEST_MODE === "true" ? (
        <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white/80">
          {mode} · {status.step}
        </div>
      ) : null}

      <div className="pointer-events-none pb-[56.25%]" />
    </div>
  );
}
