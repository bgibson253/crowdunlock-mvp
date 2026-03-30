"use client";

import { useMemo } from "react";

/**
 * Extracts a video embed URL from a raw link.
 * Supports: YouTube, YouTube Shorts, Vimeo, Dailymotion, Twitch clips, X/Twitter video posts.
 * Returns null if not a recognized video URL.
 */
function getEmbedUrl(href: string): { src: string; aspectRatio: string } | null {
  try {
    const url = new URL(href);

    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
    if (
      url.hostname === "www.youtube.com" ||
      url.hostname === "youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      const v = url.searchParams.get("v");
      if (v) {
        return {
          src: `https://www.youtube.com/embed/${v}`,
          aspectRatio: "16/9",
        };
      }
      const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        return {
          src: `https://www.youtube.com/embed/${shortsMatch[1]}`,
          aspectRatio: "9/16",
        };
      }
    }
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (id) {
        return {
          src: `https://www.youtube.com/embed/${id}`,
          aspectRatio: "16/9",
        };
      }
    }

    // Vimeo: vimeo.com/ID
    if (url.hostname === "vimeo.com" || url.hostname === "www.vimeo.com") {
      const id = url.pathname.match(/^\/(\d+)/)?.[1];
      if (id) {
        return {
          src: `https://player.vimeo.com/video/${id}`,
          aspectRatio: "16/9",
        };
      }
    }

    // Dailymotion: dailymotion.com/video/ID
    if (
      url.hostname === "www.dailymotion.com" ||
      url.hostname === "dailymotion.com"
    ) {
      const id = url.pathname.match(/^\/video\/([a-zA-Z0-9]+)/)?.[1];
      if (id) {
        return {
          src: `https://www.dailymotion.com/embed/video/${id}`,
          aspectRatio: "16/9",
        };
      }
    }

    // Twitch clips: clips.twitch.tv/SLUG
    if (url.hostname === "clips.twitch.tv") {
      const slug = url.pathname.slice(1);
      if (slug) {
        return {
          src: `https://clips.twitch.tv/embed?clip=${slug}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`,
          aspectRatio: "16/9",
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Renders an embedded video player for recognized video URLs.
 * Only renders for users with trust level >= 3.
 * Falls back to a plain link for unrecognized URLs or insufficient trust.
 */
export function VideoEmbed({
  href,
  authorTrustLevel,
}: {
  href: string;
  authorTrustLevel: number;
}) {
  const embed = useMemo(() => getEmbedUrl(href), [href]);

  // Not a video link or author doesn't have embed permissions
  if (!embed || authorTrustLevel < 3) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {href}
      </a>
    );
  }

  return (
    <div className="my-3 max-w-64">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black aspect-video"
      >
        <iframe
          src={embed.src}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          title="Embedded video"
        />
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-xs text-muted-foreground hover:underline"
      >
        {href}
      </a>
    </div>
  );
}

/**
 * Check if a URL is a recognized video link (utility for conditional rendering).
 */
export function isVideoUrl(href: string): boolean {
  return getEmbedUrl(href) !== null;
}
