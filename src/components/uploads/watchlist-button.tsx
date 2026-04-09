"use client";

import { useState, useTransition } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function WatchlistButton({
  uploadId,
  currentUserId,
  isWatched: initialIsWatched,
  variant = "icon",
}: {
  uploadId: string;
  currentUserId: string | null;
  isWatched: boolean;
  variant?: "icon" | "button";
}) {
  const [isWatched, setIsWatched] = useState(initialIsWatched);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!currentUserId) return null;

  async function handleToggle() {
    const supabase = supabaseBrowser();

    if (isWatched) {
      await supabase
        .from("upload_watchlist")
        .delete()
        .eq("user_id", currentUserId!)
        .eq("upload_id", uploadId);
      setIsWatched(false);
    } else {
      await supabase
        .from("upload_watchlist")
        .insert({ user_id: currentUserId!, upload_id: uploadId });
      setIsWatched(true);
      // Check achievements
      supabase.rpc("check_achievements", { p_user_id: currentUserId }).then(() => {});
    }
    startTransition(() => router.refresh());
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors",
          isWatched
            ? "text-primary bg-primary/10 hover:bg-primary/20"
            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark className={cn("h-4 w-4", isWatched && "fill-current")} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors border",
        isWatched
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
          : "border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30"
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={cn("h-4 w-4", isWatched && "fill-current")} />
      )}
      {isWatched ? "Watching" : "Watch"}
    </button>
  );
}
