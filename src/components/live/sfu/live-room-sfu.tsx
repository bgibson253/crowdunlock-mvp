"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";

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

type SfuCfg = {
  sfu?: { wsUrl?: string };
  turn?: Array<{ urls: string[]; username?: string; credential?: string }>;
};

export function LiveRoomSfu({ roomId, mode }: Props) {
  const isIOS = useIsIOS();

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const deviceRef = useRef<mediasoupClient.types.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [ui, setUi] = useState<UiState>(() =>
    mode === "viewer" ? "connecting" : "idle"
  );
  const [attempt, setAttempt] = useState(0);
  const [lastErr, setLastErr] = useState<string | null>(null);
  const [diag, setDiag] = useState<string[]>([]);

  const note = (s: string) =>
    setDiag((d) => [...d.slice(-40), `${new Date().toISOString()} ${s}`]);

  const cleanup = () => {
    note("cleanup()");
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
      sendTransportRef.current?.close();
    } catch {}
    try {
      recvTransportRef.current?.close();
    } catch {}

    sendTransportRef.current = null;
    recvTransportRef.current = null;

    deviceRef.current = null;

    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localStreamRef.current = null;
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

  const wsSend = (ws: WebSocket, m: any) => ws.send(JSON.stringify(m));

  const rpc = (ws: WebSocket) => {
    const vp8 = typeof RTCRtpReceiver !== "undefined" ? RTCRtpReceiver.getCapabilities?.("video") : null;
    const hasVp8 = !!vp8?.codecs?.some((c: any) => String(c?.mimeType || "").toLowerCase() === "video/vp8");

    const dump = (msg: any) => {
      try {
        if (msg?.t === "routerRtpCapabilities") {
          const codecs = Array.isArray(msg?.data?.codecs) ? msg.data.codecs : [];
          const vid = codecs.filter((c: any) => c?.kind === "video").map((c: any) => c?.mimeType);
          const aud = codecs.filter((c: any) => c?.kind === "audio").map((c: any) => c?.mimeType);
          note(`router codecs audio=${aud.join(",")} video=${vid.join(",")} localHasVp8=${hasVp8}`);
        }
      } catch {
        // ignore
      }
    };
    let seq = 0;
    const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

    const call = (t: string, data?: any) => {
      const id = ++seq;
      return new Promise<any>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        // The SFU expects most params at the top-level (not nested under `data`).
      const payload = data && typeof data === "object" ? { ...data } : undefined;
      wsSend(ws, { t, roomId, reqId: id, ...(payload ? payload : {}) });
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error(`${t} timeout`));
          }
        }, 20_000);
      });
    };

    const onMessage = (ev: MessageEvent) => {
      const msg = JSON.parse(String(ev.data));
      dump(msg);
      if (msg?.t === "error" && msg?.reqId) {
        const p = pending.get(msg.reqId);
        if (p) {
          pending.delete(msg.reqId);
          p.reject(new Error(String(msg.error || "sfu_error")));
        }
        return;
      }

      if (msg?.t === "error" && typeof msg?.reqId !== "number") {
        const first = pending.entries().next().value as
          | [number, { resolve: (v: any) => void; reject: (e: any) => void }]
          | undefined;
        note(`rpc compat error(no reqId) ${String(msg?.error || "sfu_error")}`);
        if (first) {
          const [id, p] = first;
          pending.delete(id);
          p.reject(new Error(String(msg?.error || "sfu_error")));
        }
        return;
      }

      // Server currently does not echo reqId on some responses.
      // Try to match by message type (safe here because these are strictly request→response).
      if (typeof msg?.reqId !== "number") {
        note(`rpc compat missing reqId t=${String(msg?.t || "(none)")}`);

        if (msg?.t === "routerRtpCapabilities") {
          const first = pending.entries().next().value as
            | [number, { resolve: (v: any) => void; reject: (e: any) => void }]
            | undefined;
          if (first) {
            const [id, p] = first;
            pending.delete(id);
            return p.resolve(msg.data);
          }
        }

        if (msg?.t === "createTransport.ok") {
          const first = pending.entries().next().value as
            | [number, { resolve: (v: any) => void; reject: (e: any) => void }]
            | undefined;
          if (first) {
            const [id, p] = first;
            pending.delete(id);
            return p.resolve(msg.data);
          }
        }

        if (msg?.t === "connectTransport.ok") {
          const first = pending.entries().next().value as
            | [number, { resolve: (v: any) => void; reject: (e: any) => void }]
            | undefined;
          if (first) {
            const [id, p] = first;
            pending.delete(id);
            return p.resolve(msg);
          }
        }

        if (msg?.t === "produce.ok") {
          const first = pending.entries().next().value as
            | [number, { resolve: (v: any) => void; reject: (e: any) => void }]
            | undefined;
          if (first) {
            const [id, p] = first;
            pending.delete(id);
            return p.resolve(msg);
          }
        }

        if (msg?.t === "consume.ok") {
          const first = pending.entries().next().value as
            | [number, { resolve: (v: any) => void; reject: (e: any) => void }]
            | undefined;
          if (first) {
            const [id, p] = first;
            pending.delete(id);
            return p.resolve(msg.data);
          }
        }

        if (msg?.t === "setRtpCapabilities.ok") {
          const first = pending.entries().next().value as
            | [number, { resolve: (v: any) => void; reject: (e: any) => void }]
            | undefined;
          if (first) {
            const [id, p] = first;
            pending.delete(id);
            return p.resolve(msg);
          }
        }

        if (msg?.t === "resumeConsumer.ok") {
          const first = pending.entries().next().value as
            | [number, { resolve: (v: any) => void; reject: (e: any) => void }]
            | undefined;
          if (first) {
            const [id, p] = first;
            pending.delete(id);
            return p.resolve(msg);
          }
        }
      }

      if (typeof msg?.reqId === "number") {
        const p = pending.get(msg.reqId);
        if (!p) return;

        // map known responses
        if (msg.t === "routerRtpCapabilities") {
          pending.delete(msg.reqId);
          return p.resolve(msg.data);
        }
        if (msg.t === "createTransport.ok") {
          pending.delete(msg.reqId);
          return p.resolve(msg.data);
        }
        if (msg.t === "connectTransport.ok") {
          pending.delete(msg.reqId);
          return p.resolve(msg);
        }
        if (msg.t === "produce.ok") {
          pending.delete(msg.reqId);
          return p.resolve(msg);
        }
        if (msg.t === "consume.ok") {
          pending.delete(msg.reqId);
          return p.resolve(msg.data);
        }
        if (msg.t === "resumeConsumer.ok") {
          pending.delete(msg.reqId);
          return p.resolve(msg);
        }
      }

      // push notifications
      if (msg?.t === "newProducer") {
        // handled by outer listener
        return;
      }
    };

    return { call, onMessage };
  };

  const getCfg = async (): Promise<SfuCfg> => {
    const regionRes = await fetch("/api/live/region", { cache: "no-store" });
    const regionJson = await regionRes.json().catch(() => ({}));
    const region =
      regionRes.ok &&
      (regionJson?.region === "usw2" || regionJson?.region === "use1")
        ? regionJson.region
        : "use1";

    const cfgRes = await fetch("/api/live/sfu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId, region }),
    });
    const cfg = await cfgRes.json().catch(() => ({}));
    if (!cfgRes.ok) throw new Error(cfg?.error ?? "Unable to start stream");
    return cfg;
  };

  const attachRemoteTrack = (track: MediaStreamTrack) => {
    const current = (remoteVideoRef.current?.srcObject as MediaStream | null) ?? null;
    const ms = current ?? new MediaStream();
    ms.addTrack(track);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = ms;
      remoteVideoRef.current.playsInline = true;
      remoteVideoRef.current.autoplay = true;
    }
    if (isIOS) {
      remoteVideoRef.current
        ?.play?.()
        .catch(() => {
          /* ignore */
        });
    }
  };

  const connect = async (asRole: "host" | "viewer") => {
    setLastErr(null);
    setUi((prev) => (prev === "live" ? "reconnecting" : "connecting"));

    const cfg = await getCfg();

    cleanup();

    const wsUrl = String(cfg?.sfu?.wsUrl ?? "");
    note(`cfg.wsUrl=${wsUrl || "(missing)"}`);
    if (!wsUrl) throw new Error("Missing SFU wsUrl");

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    await new Promise<void>((resolve, reject) => {
      const t = window.setTimeout(() => reject(new Error("WS connect timeout")), 12000);
      ws.addEventListener("open", () => {
        note("ws open");
        window.clearTimeout(t);
        resolve();
      });
      ws.addEventListener("error", () => {
        note("ws error (event)");
        window.clearTimeout(t);
        reject(new Error("WS error"));
      });
      ws.addEventListener("close", (ev) => {
        note(`ws close code=${(ev as CloseEvent).code} reason=${(ev as CloseEvent).reason || ""}`);
      });
    });

    const { call, onMessage } = rpc(ws);

    // Listen for RPC responses.
    ws.addEventListener("message", (ev) => {
      note(`ws message bytes=${String((ev as any).data).length}`);

      // first, let rpc resolve pending calls
      onMessage(ev as any);

      // then handle push notifications
      const msg = JSON.parse(String((ev as any).data));
      if (msg?.t === "newProducer" && msg.producerId) {
        note(`push newProducer ${msg.producerId}`);
        if (asRole === "viewer") {
          void (async () => {
            try {
              const device = deviceRef.current;
              const recvTransport = recvTransportRef.current;
              if (!device || !recvTransport) return;
              note(`rpc consume(${msg.producerId}) → send`);
              const data = await call("consume", {
                transportId: recvTransport.id,
                producerId: msg.producerId,
              });
              note(`rpc consume(${msg.producerId}) ✓`);
              const consumer = await recvTransport.consume({
                id: data.id,
                producerId: data.producerId,
                kind: data.kind,
                rtpParameters: data.rtpParameters,
              });
              attachRemoteTrack(consumer.track);
              note(`rpc resumeConsumer(${consumer.id}) → send`);
              await call("resumeConsumer", { consumerId: consumer.id });
              note(`rpc resumeConsumer(${consumer.id}) ✓`);
              setUi("live");
            } catch {
              // ignore
            }
          })();
        }
      }
    });

    ws.onclose = () => {
      scheduleRetry(1500);
    };

    // Device
    const device = new mediasoupClient.Device();
    deviceRef.current = device;

    note("rpc getRouterRtpCapabilities → send");
    const routerRtpCapabilities = await call("getRouterRtpCapabilities").catch((e: any) => {
      note(`rpc getRouterRtpCapabilities ✗ ${e?.message || String(e)}`);
      throw new Error(`getRouterRtpCapabilities failed: ${e?.message || String(e)}`);
    });
    note("rpc getRouterRtpCapabilities ✓");
    await device.load({ routerRtpCapabilities });

    await call("setRtpCapabilities", { rtpCapabilities: device.rtpCapabilities });

    // Create transports
    if (asRole === "host") {
      note("rpc createTransport(send) → send");
      // SFU expects msg.direction at top-level (not in msg.data)
      const sendT = await call("createTransport", { direction: "send" }).catch((e: any) => {
        note(`rpc createTransport(send) ✗ ${e?.message || String(e)}`);
        throw e;
      });
      note("rpc createTransport(send) ✓");
      const sendTransport = device.createSendTransport({
        id: sendT.id,
        iceParameters: sendT.iceParameters,
        iceCandidates: sendT.iceCandidates,
        dtlsParameters: sendT.dtlsParameters,
      });
      sendTransportRef.current = sendTransport;

      sendTransport.on("connect", ({ dtlsParameters }, cb, errCb) => {
        note("rpc connectTransport(send) → send");
        call("connectTransport", { transportId: sendTransport.id, dtlsParameters })
          .then(() => {
            note("rpc connectTransport(send) ✓");
            cb();
          })
          .catch((e) => {
            note(`rpc connectTransport(send) ✗ ${e?.message || String(e)}`);
            errCb(e);
          });
      });

      sendTransport.on(
        "produce",
        ({ kind, rtpParameters }, cb, errCb) => {
          note(`rpc produce(${kind}) → send`);
          call("produce", {
            transportId: sendTransport.id,
            kind,
            rtpParameters,
          })
            .then((res) => {
              note(`rpc produce(${kind}) ✓`);
              cb({ id: res.id });
            })
            .catch((e) => {
              note(`rpc produce(${kind}) ✗ ${e?.message || String(e)}`);
              errCb(e);
            });
        }
      );

      // get camera/mic + produce
      note("getUserMedia → request");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        note("getUserMedia ✓");
      } catch (e: any) {
        note(`getUserMedia ✗ ${e?.name || e?.message || String(e)}`);
        setLastErr(
          e?.name === "NotAllowedError"
            ? "Camera/mic permission blocked."
            : e?.message
              ? String(e.message)
              : "Unable to access camera/mic"
        );
        setUi("error");
        return;
      }

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.playsInline = true;
        localVideoRef.current.autoplay = true;
        localVideoRef.current.play().catch(() => {});
      }

      const videoTrack = stream.getVideoTracks()[0] ?? null;
      const audioTrack = stream.getAudioTracks()[0] ?? null;

      if (videoTrack) {
        await sendTransport.produce({ track: videoTrack });
      }
      if (audioTrack) {
        await sendTransport.produce({ track: audioTrack });
      }

      setUi("live");
      return;
    }

    // viewer
    note("rpc createTransport(recv) → send");
    const recvT = await call("createTransport", { direction: "recv" }).catch((e: any) => {
      note(`rpc createTransport(recv) ✗ ${e?.message || String(e)}`);
      throw e;
    });
    note("rpc createTransport(recv) ✓");
    const recvTransport = device.createRecvTransport({
      id: recvT.id,
      iceParameters: recvT.iceParameters,
      iceCandidates: recvT.iceCandidates,
      dtlsParameters: recvT.dtlsParameters,
    });
    recvTransportRef.current = recvTransport;

    recvTransport.on("connect", ({ dtlsParameters }, cb, errCb) => {
      note("rpc connectTransport(recv) → send");
      call("connectTransport", { transportId: recvTransport.id, dtlsParameters })
        .then(() => {
          note("rpc connectTransport(recv) ✓");
          cb();
        })
        .catch((e) => {
          note(`rpc connectTransport(recv) ✗ ${e?.message || String(e)}`);
          errCb(e);
        });
    });

    // viewer waits for newProducer notifications
    setUi("waiting");
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
            Waiting for host…
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
            <div className="mt-1 whitespace-pre-wrap text-white/80">
              {lastErr || "Please try again."}
              {"\n\n"}
              <span className="text-white/60">diag (tap to copy):</span>
              {"\n"}
              <textarea
                readOnly
                value={diag.join("\n")}
                className="pointer-events-auto mt-2 h-56 w-full resize-none rounded-lg bg-black/40 p-2 font-mono text-[11px] text-white/80"
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
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

      <div className="pointer-events-none pb-[56.25%]" />
    </div>
  );
}
