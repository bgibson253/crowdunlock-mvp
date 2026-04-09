"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function UserFavoriteButton({ targetUserId }: { targetUserId: string }) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;
      const { data: row } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", uid)
        .eq("target_user_id", targetUserId)
        .maybeSingle();
      setIsFav(!!row);
    })();
  }, [targetUserId]);

  async function toggle() {
    if (!userId || loading) return;
    setLoading(true);
    const supabase = supabaseBrowser();
    if (isFav) {
      await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("target_user_id", targetUserId);
      setIsFav(false);
    } else {
      await supabase
        .from("user_favorites")
        .insert({ user_id: userId, target_user_id: targetUserId });
      setIsFav(true);
    }
    setLoading(false);
  }

  if (!userId || userId === targetUserId) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={loading}
      aria-label={isFav ? "Remove user from favorites" : "Add user to favorites"}
      className="h-8 gap-1.5 text-xs"
    >
      <Heart
        className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
      />
      {isFav ? "Favorited" : "Favorite"}
    </Button>
  );
}
