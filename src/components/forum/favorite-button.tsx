"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  threadId,
  userId: serverUserId,
}: {
  threadId: string;
  userId: string | null;
}) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(serverUserId);

  useEffect(() => {
    async function resolve() {
      if (serverUserId) { setUserId(serverUserId); return; }
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    }
    resolve();
  }, [serverUserId]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("forum_favorites")
        .select("thread_id")
        .eq("user_id", userId)
        .eq("thread_id", threadId)
        .maybeSingle();
      setIsFav(!!data);
    })();
  }, [userId, threadId]);

  async function toggle() {
    if (!userId || loading) return;
    setLoading(true);
    const supabase = supabaseBrowser();
    if (isFav) {
      await supabase
        .from("forum_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("thread_id", threadId);
      setIsFav(false);
    } else {
      await supabase
        .from("forum_favorites")
        .insert({ user_id: userId, thread_id: threadId });
      setIsFav(true);
    }
    setLoading(false);
  }

  if (!userId) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="h-8 gap-1.5 text-xs"
    >
      <Heart
        className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
      />
      {isFav ? "Favorited" : "Favorite"}
    </Button>
  );
}
