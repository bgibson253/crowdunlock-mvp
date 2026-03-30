"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownEditor } from "@/components/forum/markdown-editor";

export function ReplyForm({
  threadId,
  initialBody,
  onReplyPosted,
}: {
  threadId: string;
  initialBody?: string;
  onReplyPosted?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trustLevel, setTrustLevel] = useState(0);

  // Update body when initialBody changes (for quote)
  useEffect(() => {
    if (initialBody && initialBody !== body) {
      setBody(initialBody);
    }
    // Only trigger when initialBody prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBody]);

  useEffect(() => {
    async function fetchTrust() {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("trust_level")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (data) setTrustLevel(data.trust_level ?? 0);
    }
    fetchTrust();
  }, []);

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

      const { data: replyData, error: insertErr } = await supabase
        .from("forum_replies")
        .insert({ thread_id: threadId, body })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // Award points for posting a reply
      try {
        await supabase.rpc("award_points", {
          p_user_id: auth.user.id,
          p_points: 3,
          p_reason: "reply_posted",
          p_ref_id: replyData.id,
        });
      } catch {}

      setBody("");
      onReplyPosted?.();
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
          <MarkdownEditor
            value={body}
            onChange={setBody}
            placeholder="Write your reply… (Markdown supported)"
            rows={4}
            authorTrustLevel={trustLevel}
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
