"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ReplyForm } from "@/components/forum/reply-form";
import { Card, CardContent } from "@/components/ui/card";

export function ReplyFormGate({ threadId }: { threadId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      setChecked(true);
    }
    check();
  }, []);

  if (!checked) return null;

  if (userId) {
    return <ReplyForm threadId={threadId} />;
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="py-6 text-sm">
        <a className="underline" href={`/auth?redirect=${encodeURIComponent(`/forum/${threadId}`)}`}>
          Sign in
        </a>{" "}
        to reply.
      </CardContent>
    </Card>
  );
}
