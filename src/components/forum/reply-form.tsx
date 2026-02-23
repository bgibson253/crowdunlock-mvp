"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        setError("You must be signed in.");
        return;
      }

      const { error: insertErr } = await supabase
        .from("forum_replies")
        .insert({ thread_id: threadId, body });

      if (insertErr) throw insertErr;

      setBody("");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to reply");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="text-sm font-medium">Reply</div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" disabled={!body || submitting}>
            {submitting ? "Posting…" : "Post reply"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
