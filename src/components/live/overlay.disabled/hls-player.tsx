"use client";

import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PlayerState =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "playing" }
  | { s: "error"; message: string };

export type HlsVariant = {
  index: number;
  height?: number;
  bitrate?: number;
  label: string;
};

export function HlsPlayer(props: {
  src: string;
  poster?: string;
  className?: string;
  lowLatency?: boolean;
  muted?: boolean;
  quality?: "auto" | number; // auto or Hls level index
  onQualityChange?: (q: "auto" | number) => void;
  onVariants?: (v: HlsVariant[]) => void;
  onState?: (st: PlayerState) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<PlayerState>({ s: "idle" });

  const supportsNative = useMemo(() => {
    if (typeof document === "undefined") return false;
    const v = document.createElement("video");
    return v.canPlayType("application/vnd.apple.mpegurl") !== "";
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    queueMicrotask(() => {
      setState({ s: "loading" });
      props.onState?.({ s: "loading" });
    });

    if (supportsNative) {
      // Native HLS (Safari). We can't get ABR levels reliably.
      video.src = props.src;
      video
        .play()
        .then(() => {
          setState({ s: "playing" });
          props.onState?.({ s: "playing" });
        })
        .catch((e) => {
          const message = e?.message ? String(e.message) : "Playback failed";
          setState({ s: "error", message });
          props.onState?.({ s: "error", message });
        });
      return;
    }

    if (!Hls.isSupported()) {
      const message = "HLS not supported in this browser.";
      queueMicrotask(() => {
        setState({ s: "error", message });
        props.onState?.({ s: "error", message });
      });
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: props.lowLatency ?? true,
      backBufferLength: 30,
      maxLiveSyncPlaybackRate: 1.1,
    });

    const emitVariants = () => {
      const levels = hls.levels || [];
      const v: HlsVariant[] = levels.map((lvl, idx) => {
        const height = lvl?.height;
        const bitrate = lvl?.bitrate;
        const label = height ? `${height}p` : bitrate ? `${Math.round(bitrate / 1000)}kbps` : `Level ${idx}`;
        return { index: idx, height, bitrate, label };
      });
      props.onVariants?.(v);
    };

    const onError = (_evt: unknown, data: { fatal?: boolean; details?: string } | undefined) => {
      if (!data) return;
      if (data.fatal) {
        const message = data?.details ? String(data.details) : "Fatal HLS error";
        setState({ s: "error", message });
        props.onState?.({ s: "error", message });
        try {
          hls.destroy();
        } catch {}
      }
    };

    hls.on(Hls.Events.ERROR, onError);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      emitVariants();
      // Apply requested quality after manifest is known
      if (props.quality === "auto" || props.quality === undefined) {
        hls.currentLevel = -1;
      } else {
        hls.currentLevel = props.quality;
      }
    });

    hls.attachMedia(video);
    hls.loadSource(props.src);

    const onCanPlay = () => {
      video
        .play()
        .then(() => {
          setState({ s: "playing" });
          props.onState?.({ s: "playing" });
        })
        .catch(() => {
          // autoplay may be blocked; user gesture will start
        });
    };

    video.addEventListener("canplay", onCanPlay);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      try {
        hls.destroy();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.src, props.lowLatency, supportsNative]);

  // Reactively apply quality selection.
  useEffect(() => {
    if (supportsNative) return;
    // We can only influence quality when hls.js is used; the instance lives inside the effect.
    // For a production build, you can refactor hls into a ref; for this demo we re-init on src.
  }, [props.quality, supportsNative]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-2xl bg-black", props.className)}>
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        playsInline
        muted={props.muted ?? false}
        controls={false}
        preload="metadata"
        poster={props.poster}
      />

      {state.s === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Badge className="bg-black/50 text-white border-white/10">Loading…</Badge>
        </div>
      )}

      {state.s === "error" && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="max-w-sm rounded-xl border border-white/10 bg-black/60 p-4 text-center text-sm text-white/90">
            <div className="font-medium">Playback issue</div>
            <div className="mt-1 text-white/70">{state.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
