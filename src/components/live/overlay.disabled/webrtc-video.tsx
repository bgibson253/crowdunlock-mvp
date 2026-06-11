"use client";

import { useEffect, useRef, useState } from "react";

export type WebRtcVideoState =
  | { s: "idle" }
  | { s: "playing" }
  | { s: "loading" }
  | { s: "error"; message: string };

export function WebRtcVideo(props: {
  videoEl: HTMLVideoElement | null;
  className?: string;
  muted?: boolean;
  onState?: (s: WebRtcVideoState) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<WebRtcVideoState>({ s: "idle" });

  useEffect(() => {
    props.onState?.(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.s]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // cleanup existing
    container.innerHTML = "";

    const v = props.videoEl;
    if (!v) {
      setState({ s: "loading" });
      return;
    }

    try {
      v.controls = false;
      v.muted = !!props.muted;
      v.playsInline = true;
      v.autoplay = true;
      v.className = props.className ?? "";

      // keep the local ref wired even after DOM moves
      v.setAttribute("playsinline", "true");

      container.appendChild(v);
      setState({ s: "loading" });

      const onPlaying = () => setState({ s: "playing" });
      const onWaiting = () => setState({ s: "loading" });
      const onError = () => setState({ s: "error", message: "Video error" });

      v.addEventListener("playing", onPlaying);
      v.addEventListener("waiting", onWaiting);
      v.addEventListener("error", onError);

      // attempt play
      v.play?.().then(
        () => setState({ s: "playing" }),
        () => setState({ s: "loading" })
      );

      return () => {
        v.removeEventListener("playing", onPlaying);
        v.removeEventListener("waiting", onWaiting);
        v.removeEventListener("error", onError);
      };
    } catch (e: any) {
      setState({ s: "error", message: e?.message || "Failed to attach video" });
    }
  }, [props.videoEl, props.className, props.muted]);

  return <div ref={containerRef} className={props.className} style={{ contain: "layout paint size" }} />;
}
