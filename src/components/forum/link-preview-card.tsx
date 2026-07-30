"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type Preview = {
  title: string;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string;
};

/**
 * Reddit-style link preview card. Fetches OpenGraph metadata via
 * /api/link-preview (server-side fetch + 7-day cache) and renders a
 * clickable card with image, title, description, and domain.
 * Falls back to a plain link if no metadata is available.
 */
export function LinkPreviewCard({ href }: { href: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        if (!cancelled) setPreview(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [href]);

  let domain = "";
  try {
    domain = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    /* noop */
  }

  // No metadata → plain link (same as before this feature existed)
  if (failed) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
        {href}
      </a>
    );
  }

  // Loading skeleton
  if (!preview) {
    return (
      <span className="block my-2 rounded-xl border border-border/50 bg-card/50 p-3.5">
        <span className="block h-4 w-2/3 animate-pulse rounded bg-muted mb-2" />
        <span className="block h-3 w-full animate-pulse rounded bg-muted/60 mb-1" />
        <span className="block h-3 w-1/3 animate-pulse rounded bg-muted/40" />
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block my-2 overflow-hidden rounded-xl border border-border/50 bg-card/50 no-underline backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card/80"
    >
      <span className="flex items-stretch">
        <span className="flex-1 min-w-0 p-3.5 block">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{preview.siteName || domain}</span>
          </span>
          <span className="block text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {preview.title}
          </span>
          {preview.description && (
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {preview.description}
            </span>
          )}
        </span>
        {preview.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="hidden sm:block w-36 shrink-0 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </span>
    </a>
  );
}
