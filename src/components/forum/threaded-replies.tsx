"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ChevronDown, ChevronRight } from "lucide-react";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownBody } from "@/components/forum/markdown-body";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { Reactions } from "@/components/forum/reactions";

export type ReplyNode = {
  id: string;
  body: string;
  author_id: string;
  author_name: string;
  created_at: string;
  parent_reply_id: string | null;
  children: ReplyNode[];
};

function buildTree(replies: Omit<ReplyNode, "children">[]): ReplyNode[] {
  const map = new Map<string, ReplyNode>();
  const roots: ReplyNode[] = [];

  for (const r of replies) {
    map.set(r.id, { ...r, children: [] });
  }

  for (const r of replies) {
    const node = map.get(r.id)!;
    if (r.parent_reply_id && map.has(r.parent_reply_id)) {
      map.get(r.parent_reply_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function ReplyCard({
  reply,
  depth,
  userId,
  threadId,
  onReplyPosted,
}: {
  reply: ReplyNode;
  depth: number;
  userId: string | null;
  threadId: string;
  onReplyPosted: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Max 3 levels of indentation, then flatten
  const indent = Math.min(depth, 3);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const supabase = supabaseBrowser();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError("You must be signed in.");
        return;
      }
      const { error: insertErr } = await supabase.from("forum_replies").insert({
        thread_id: threadId,
        body: replyBody,
        author_id: auth.user.id,
        parent_reply_id: reply.id,
      });
      if (insertErr) throw insertErr;
      setReplyBody("");
      setShowReplyForm(false);
      onReplyPosted();
    } catch (err: any) {
      setError(err?.message ?? "Failed to reply");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginLeft: `${indent * 24}px` }}>
      <Card className="mt-2">
        <CardContent className="py-3">
          <div className="flex items-start gap-2">
            {reply.children.length > 0 && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="mt-0.5 p-0.5 rounded hover:bg-muted transition"
              >
                {collapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">{reply.author_name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(reply.created_at).toLocaleString()}
                </span>
              </div>

              <MarkdownBody content={reply.body} />
              <Reactions targetType="reply" targetId={reply.id} userId={userId} />

              {userId && (
                <div className="mt-1">
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Reply
                  </button>
                </div>
              )}

              {showReplyForm && (
                <form onSubmit={handleReply} className="mt-2 space-y-2">
                  <MarkdownEditor
                    value={replyBody}
                    onChange={setReplyBody}
                    placeholder={`Reply to ${reply.author_name}…`}
                    rows={3}
                  />
                  {error && <div className="text-xs text-red-600">{error}</div>}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!replyBody.trim() || submitting}
                      className="h-7 text-xs"
                    >
                      {submitting ? "Posting…" : "Reply"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyForm(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!collapsed &&
        reply.children.map((child) => (
          <ReplyCard
            key={child.id}
            reply={child}
            depth={depth + 1}
            userId={userId}
            threadId={threadId}
            onReplyPosted={onReplyPosted}
          />
        ))}
    </div>
  );
}

export function ThreadedReplies({
  replies,
  userId: serverUserId,
  threadId,
  authorNames,
}: {
  replies: Array<{
    id: string;
    body: string;
    author_id: string;
    created_at: string;
    parent_reply_id: string | null;
  }>;
  userId: string | null;
  threadId: string;
  authorNames: Record<string, string>;
}) {
  const router = useRouter();
  const [replyData, setReplyData] = useState(replies);
  // Resolve userId client-side (SSR may pass null even when logged in)
  const [userId, setUserId] = useState<string | null>(serverUserId);

  useEffect(() => {
    async function resolveUser() {
      if (serverUserId) {
        setUserId(serverUserId);
        return;
      }
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    }
    resolveUser();
  }, [serverUserId]);

  async function refreshReplies() {
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from("forum_replies")
      .select("id, body, author_id, created_at, parent_reply_id")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (data) {
      setReplyData(data as any[]);
    }

    // Also try to refresh server component
    router.refresh();
  }

  const repliesWithNames = replyData.map((r) => ({
    ...r,
    author_name: authorNames[r.author_id] || (r.author_id ? "Anonymous" : "Administrator"),
  }));

  const tree = buildTree(repliesWithNames);

  if (tree.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No replies yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      {tree.map((node) => (
        <ReplyCard
          key={node.id}
          reply={node}
          depth={0}
          userId={userId}
          threadId={threadId}
          onReplyPosted={refreshReplies}
        />
      ))}
    </div>
  );
}
