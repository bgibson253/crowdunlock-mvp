"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function FollowButton({
  targetUserId,
  currentUserId,
  isFollowing: initialIsFollowing,
}: {
  targetUserId: string;
  currentUserId: string | null;
  isFollowing: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!currentUserId || currentUserId === targetUserId) return null;

  async function handleToggle() {
    const supabase = supabaseBrowser();

    if (isFollowing) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", currentUserId!)
        .eq("following_id", targetUserId);
      setIsFollowing(false);
    } else {
      await supabase
        .from("user_follows")
        .insert({ follower_id: currentUserId!, following_id: targetUserId });
      setIsFollowing(true);
      // Check achievements
      supabase.rpc("check_achievements", { p_user_id: currentUserId }).then(() => {});
    }
    startTransition(() => router.refresh());
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isFollowing ? "Unfollow user" : "Follow user"}
      className={isFollowing ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" : ""}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}
