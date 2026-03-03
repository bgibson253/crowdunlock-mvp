"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SubscribeButton({
  threadId,
  userId,
}: {
  threadId: string;
  userId: string | null;
}) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subId, setSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("forum_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("thread_id", threadId)
        .eq("type", "thread")
        .maybeSingle();
      if (data) {
        setIsSubscribed(true);
        setSubId((data as any).id);
      }
    })();
  }, [userId, threadId]);

  async function toggle() {
    if (!userId || loading) return;
    setLoading(true);
    const supabase = supabaseBrowser();
    if (isSubscribed && subId) {
      await supabase.from("forum_subscriptions").delete().eq("id", subId);
      setIsSubscribed(false);
      setSubId(null);
    } else {
      const { data } = await supabase
        .from("forum_subscriptions")
        .insert({
          user_id: userId,
          thread_id: threadId,
          type: "thread",
        })
        .select("id")
        .single();
      if (data) {
        setIsSubscribed(true);
        setSubId((data as any).id);
      }
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
