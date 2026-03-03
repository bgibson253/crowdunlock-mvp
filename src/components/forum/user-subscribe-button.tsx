"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function UserSubscribeButton({ targetUserId }: { targetUserId: string }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subId, setSubId] = useState<string | null>(null);
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
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", uid)
        .eq("target_user_id", targetUserId)
        .maybeSingle();
      if (row) {
        setIsSubscribed(true);
        setSubId((row as any).id);
      }
    })();
  }, [targetUserId]);

  async function toggle() {
    if (!userId || loading) return;
    setLoading(true);
    const supabase = supabaseBrowser();
    if (isSubscribed && subId) {
      await supabase.from("user_subscriptions").delete().eq("id", subId);
      setIsSubscribed(false);
      setSubId(null);
    } else {
      const { data } = await supabase
        .from("user_subscriptions")
        .insert({ user_id: userId, target_user_id: targetUserId })
        .select("id")
        .single();
      if (data) {
        setIsSubscribed(true);
        setSubId((data as any).id);
      }
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
      className="h-8 gap-1.5 text-xs"
    >
      {isSubscribed ? (
        <>
          <BellOff className="h-4 w-4 text-muted-foreground" />
          Unsubscribe
        </>
      ) : (
        <>
          <BellRing className="h-4 w-4 text-muted-foreground" />
          Subscribe
        </>
      )}
    </Button>
  );
}
