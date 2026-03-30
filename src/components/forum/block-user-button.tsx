"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Ban, UserX } from "lucide-react";
import { toast } from "sonner";

export function BlockUserButton({
  targetUserId,
  targetName,
  isBlocked: initialBlocked = false,
}: {
  targetUserId: string;
  targetName: string;
  isBlocked?: boolean;
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const supabase = supabaseBrowser();

    if (blocked) {
      await supabase
        .from("user_blocks")
        .delete()
        .eq("blocked_id", targetUserId);
      setBlocked(false);
      toast.success(`Unblocked ${targetName}`);
    } else {
      const { error } = await supabase
        .from("user_blocks")
        .insert({ blocker_id: (await supabase.auth.getUser()).data.user!.id, blocked_id: targetUserId });
      if (error?.code === "23505") {
        setBlocked(true);
      } else if (error) {
        toast.error("Failed to block user");
      } else {
        setBlocked(true);
        toast.success(`Blocked ${targetName}`);
      }
    }
    setLoading(false);
  }

  return (
    <Button
      variant={blocked ? "destructive" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-1.5 text-xs"
    >
      {blocked ? (
        <>
          <UserX className="h-3.5 w-3.5" />
          Unblock
        </>
      ) : (
        <>
          <Ban className="h-3.5 w-3.5" />
          Block
        </>
      )}
    </Button>
  );
}
