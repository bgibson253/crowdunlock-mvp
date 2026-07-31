"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * One-click share. Mobile: opens the native share sheet (X/WhatsApp/SMS/etc.
 * in a single tap). Desktop: copies the link instantly with a toast.
 * Safe inside <Link> cards — stops propagation so it never navigates.
 */
export function QuickShare({
  url,
  title,
  compact = false,
  className = "",
}: {
  url: string; // path like /forum/abc or absolute
  title: string;
  compact?: boolean;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const fullUrl = url.startsWith("http")
      ? url
      : `${window.location.origin}${url}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url: fullUrl });
        return;
      } catch {
        // cancelled or unsupported — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      setDone(true);
      toast.success("Link copied — paste it anywhere");
      setTimeout(() => setDone(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={share}
        aria-label={`Share: ${title}`}
        title="Share"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-primary/10 hover:text-primary ${className}`}
      >
        {done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share: ${title}`}
      className={`inline-flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary ${className}`}
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
      Share
    </button>
  );
}
