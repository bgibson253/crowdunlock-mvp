"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Minimal SFU client: bootstrap for end-to-end.
// - Host: getUserMedia + send offer via WS
// - Viewer: receive offer/answer flow + attach remote stream
//
// NOTE: This is NOT the final mediasoup client (which uses send/recv transports).
// This is a temporary WebRTC baseline to validate TURN + signaling plumbing.

export function LiveRoomSfu({ roomId }: { roomId: string }) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [role, setRole] = useState<"host" | "viewer" | null>(null);
  const [status, setStatus] = useState("idle");

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

  const start = async (asRole: "host" | "viewer") => {
    setRole(asRole);
    setStatus("loading");

    const cfgRes = await fetch("/api/live/sfu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId }),
    });
    const cfg = await cfgRes.json().catch(() => ({}));
    if (!cfgRes.ok) throw new Error(cfg?.error ?? "Failed to fetch SFU config");

    const pc = new RTCPeerConnection({
      iceServers: cfg.turn?.length ? cfg.turn : [{ urls: ["stun:stun.l.google.com:19302"] }],
    });
    pcRef.current = pc;

    pc.oniceconnectionstatechange = () => {
      setStatus(`ice:${pc.iceConnectionState}`);
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
      setStatus("ws:open");

      if (asRole === "host") {
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
        return;
      }

      if (msg.t === "webrtc.ice" && msg.candidate) {
        try {
          await pc.addIceCandidate(msg.candidate);
        } catch {}
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && ws.readyState === WebSocket.OPEN) {
        send({ t: "webrtc.ice", roomId, candidate: ev.candidate });
      }
    };

    ws.onerror = () => {
      toast.error("SFU websocket error");
      setStatus("ws:error");
    };

    ws.onclose = () => {
      setStatus("ws:closed");
    };
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/50 bg-card/50 p-3">
      <div className="flex items-center gap-2">
        <button
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          onClick={() => start("host")}
          disabled={role !== null}
        >
          Start as Host (SFU)
        </button>
        <button
          className="rounded-md bg-secondary px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => start("viewer")}
          disabled={role !== null}
        >
          Join as Viewer (SFU)
        </button>
        <div className="text-xs text-muted-foreground">{status}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Local</div>
          <video ref={localVideoRef} className="aspect-video w-full rounded-lg bg-black" />
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Remote</div>
          <video ref={remoteVideoRef} className="aspect-video w-full rounded-lg bg-black" />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        SFU v1 bootstrap: this validates TURN + signaling plumbing. Next step is full mediasoup
        send/recv transports + simulcast.
      </div>
    </div>
  );
}
