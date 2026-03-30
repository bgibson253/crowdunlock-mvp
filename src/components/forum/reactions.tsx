"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const EMOJI_LIST = ["👍", "❤️", "😂", "🔥", "👀", "💯"];

type ReactionCount = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export function Reactions({
  targetType,
  targetId,
  userId: serverUserId,
  authorId,
}: {
  targetType: "thread" | "reply";
  targetId: string;
  userId: string | null;
  authorId?: string | null;
}) {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  // Resolve userId client-side so it works even when SSR passes null
  const [userId, setUserId] = useState<string | null>(serverUserId);

  useEffect(() => {
    async function resolveUser() {
      if (serverUserId) {
        setUserId(serverUserId);
        return;
      }
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    }
    resolveUser();
  }, [serverUserId]);

  useEffect(() => {
    fetchReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, userId]);

  async function fetchReactions() {
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from("forum_reactions")
      .select("emoji, user_id")
      .eq("target_type", targetType)
      .eq("target_id", targetId);

    const counts: Record<string, { count: number; reacted: boolean }> = {};
    let userEmoji: string | null = null;
    for (const r of (data ?? []) as any[]) {
      if (!counts[r.emoji]) counts[r.emoji] = { count: 0, reacted: false };
      counts[r.emoji].count++;
      if (userId && r.user_id === userId) {
        counts[r.emoji].reacted = true;
        userEmoji = r.emoji;
      }
    }

    setMyEmoji(userEmoji);
    setReactions(
      Object.entries(counts)
        .map(([emoji, { count, reacted }]) => ({ emoji, count, reacted }))
        .sort((a, b) => b.count - a.count)
    );
  }

  // Can't react to your own posts
  const isOwnPost = !!(userId && authorId && userId === authorId);

  async function toggleReaction(emoji: string) {
    if (!userId || loading || isOwnPost) return;
    setLoading(true);
    const supabase = supabaseBrowser();

    if (myEmoji === emoji) {
      // Undo current reaction
      await supabase
        .from("forum_reactions")
        .delete()
        .eq("user_id", userId)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("emoji", emoji);
    } else {
      // Remove any existing reaction first (one reaction per user per target)
      if (myEmoji) {
        await supabase
          .from("forum_reactions")
          .delete()
          .eq("user_id", userId)
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .eq("emoji", myEmoji);
      }
      // Insert new reaction
      await supabase.from("forum_reactions").insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        emoji,
      });
    }

    await fetchReactions();
    setShowPicker(false);
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          disabled={!userId}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition hover:bg-muted/50 ${
            r.reacted
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}

      {userId && !isOwnPost && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center justify-center rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/50 transition"
          >
            +
          </button>
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-lg border bg-background p-1.5 shadow-lg z-10">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className={`rounded p-1 text-base transition ${
                    myEmoji === emoji ? "bg-indigo-100 ring-1 ring-indigo-300" : "hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
