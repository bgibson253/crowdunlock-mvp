"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ threadId, title }: { threadId: string; title: string }) {
  async function handleShare() {
    let url = `${window.location.origin}/forum/${threadId}`;

    // Count the share + get referral attribution (best-effort)
    try {
      const res = await fetch(`/api/forum/threads/${threadId}/share`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (json?.ref) {
        const u = new URL(url);
        u.searchParams.set("ref", json.ref);
        url = u.toString();
      }
    } catch {
      // plain link
    }

    // Try native share API first (mobile)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Couldn't copy link.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      aria-label="Share thread"
      className="border-border/50 text-muted-foreground hover:text-foreground text-xs gap-1.5"
    >
      <Share2 className="h-3.5 w-3.5" />
      Share
    </Button>
  );
}
