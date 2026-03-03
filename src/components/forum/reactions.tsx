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
  userId,
}: {
  targetType: "thread" | "reply";
  targetId: string;
  userId: string | null;
}) {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  // Track which emoji the current user has reacted with (null = none)
  const [myEmoji, setMyEmoji] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

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

  async function toggleReaction(emoji: string) {
    if (!userId || loading) return;
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
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-border text-muted-foreground"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}

      {userId && (
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
