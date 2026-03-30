"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ threadId, title }: { threadId: string; title: string }) {
  async function handleShare() {
    const url = `${window.location.origin}/forum/${threadId}`;

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
      className="border-border/50 text-muted-foreground hover:text-foreground text-xs gap-1.5"
    >
      <Share2 className="h-3.5 w-3.5" />
      Share
    </Button>
  );
}
