"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { relativeTime } from "@/lib/relative-time";
import { MessageSquare, PenLine } from "lucide-react";

type Update = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  author_id: string;
};

export function UploadUpdatesSection({
  uploadId,
  uploaderId,
  currentUserId,
  updates,
}: {
  uploadId: string;
  uploaderId: string | null;
  currentUserId: string | null;
  updates: Update[];
}) {
  const isUploader = currentUserId && uploaderId && currentUserId === uploaderId;
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();
      const { error: insertError } = await supabase.from("upload_updates").insert({
        upload_id: uploadId,
        author_id: currentUserId!,
        title: title.trim(),
        body: body.trim(),
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        setTitle("");
        setBody("");
        setShowForm(false);
        // Fire email notifications (fire-and-forget)
        fetch("/api/uploads/updates/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upload_id: uploadId, title: title.trim() }),
        }).catch(() => {});
        router.refresh();
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Updates ({updates.length})
          </CardTitle>
          {isUploader && !showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-1"
            >
              <PenLine className="h-3 w-3" />
              Post Update
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post form for uploader */}
        {isUploader && showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border/50 p-4 bg-muted/30">
            <Input
              placeholder="Update title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Write your update (markdown supported)…"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Posting…" : "Post Update"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        )}

        {/* Updates list */}
        {updates.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No updates yet.
            {isUploader && <span> Post one to keep your backers informed!</span>}
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="rounded-lg border border-border/50 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{update.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(update.created_at)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {update.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
