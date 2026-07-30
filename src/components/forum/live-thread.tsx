"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Live thread updates via Supabase Realtime.
 * Subscribes to INSERTs on forum_replies for this thread.
 *  - Replies from OTHERS → shows a "N new replies" pill; clicking refreshes.
 *  - Auto-refreshes via router.refresh() when the user is near the bottom.
 * Own replies are ignored (the reply form already refreshes optimistically).
 */
export function LiveThread({ threadId, userId }: { threadId: string; userId: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_replies",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const authorId = (payload.new as any)?.author_id;
          if (authorId && authorId === userIdRef.current) return; // own reply

          // Near the bottom? Just refresh silently.
          const nearBottom =
            window.innerHeight + window.scrollY >= document.body.offsetHeight - 600;
          if (nearBottom) {
            router.refresh();
          } else {
            setPending((n) => n + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, router]);

  if (pending === 0) return null;

  return (
    <button
      onClick={() => {
        setPending(0);
        router.refresh();
      }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-primary/30 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-transform hover:scale-105"
    >
      ↓ {pending} new repl{pending === 1 ? "y" : "ies"}
    </button>
  );
}
