"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Flag,
  Quote as QuoteIcon,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownBody } from "@/components/forum/markdown-body";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { Reactions } from "@/components/forum/reactions";
import { ReportModal } from "@/components/forum/report-modal";
import { relativeTime } from "@/lib/relative-time";
import { toast } from "sonner";

export type ReplyNode = {
  id: string;
  body: string;
  author_id: string;
  author_name: string;
  author_trust_level: number;
  author_avatar_url: string | null;
  author_post_count: number;
  author_unlock_tier_label: string | null;
  author_unlock_tier_icon: string | null;
  created_at: string;
  edited_at: string | null;
  parent_reply_id: string | null;
  deleted_at: string | null;
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
  isLocked,
  isAdmin,
  onReplyPosted,
  onQuote,
  threadAuthorId,
  solutionReplyId,
  onMarkSolution,
}: {
  reply: ReplyNode;
  depth: number;
  userId: string | null;
  threadId: string;
  isLocked: boolean;
  isAdmin: boolean;
  onReplyPosted: () => void;
  onQuote: (text: string) => void;
  threadAuthorId: string | null;
  solutionReplyId: string | null;
  onMarkSolution: (replyId: string) => void;
}) {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(reply.body);
  const [editSaving, setEditSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const indent = Math.min(depth, 3);
  const isAuthor = userId === reply.author_id;
  const isDeleted = !!reply.deleted_at;

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

  async function handleEdit() {
    if (!editBody.trim()) return;
    setEditSaving(true);
    try {
      const supabase = supabaseBrowser();
      const { error: updateErr } = await supabase
        .from("forum_replies")
        .update({ body: editBody.trim(), edited_at: new Date().toISOString() })
        .eq("id", reply.id);
      if (updateErr) throw updateErr;
      setEditing(false);
      onReplyPosted();
    } catch (err: any) {
      setError(err?.message ?? "Failed to save");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this reply?")) return;
    const supabase = supabaseBrowser();
    await supabase
      .from("forum_replies")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", reply.id);
    onReplyPosted();
  }

  function handleQuote() {
    const quotedLines = reply.body
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    const quoteText = `> **${reply.author_name}** wrote:\n${quotedLines}\n\n`;

    // If nested, open inline reply with quote
    setReplyBody(quoteText);
    setShowReplyForm(true);

    // Also trigger parent quote for the main form
    onQuote(quoteText);
  }

  if (isDeleted) {
    return (
      <div style={{ marginLeft: `${indent * 24}px` }}>
        <Card className="mt-1 opacity-50">
          <CardContent className="py-1.5 px-2">
            <p className="text-xs text-muted-foreground italic">[deleted]</p>
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
              isLocked={isLocked}
              isAdmin={isAdmin}
              onReplyPosted={onReplyPosted}
              onQuote={onQuote}
              threadAuthorId={threadAuthorId}
              solutionReplyId={solutionReplyId}
              onMarkSolution={onMarkSolution}
            />
          ))}
      </div>
    );
  }

  return (
    <div style={{ marginLeft: `${indent * 24}px` }}>
      <Card className="mt-1">
        <CardContent className="py-1.5 px-2">
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
              <div className="grid gap-1.5 md:grid-cols-[90px_1fr]">
                {/* Mobile: compact horizontal author row */}
                <div className="md:hidden flex items-center gap-2 pb-1 border-b mb-1">
                  {reply.author_id ? (
                    <a href={`/profile/${reply.author_id}`} className="flex items-center gap-1.5 hover:underline">
                      <Avatar className="h-5 w-5">
                        {reply.author_avatar_url ? <AvatarImage src={reply.author_avatar_url} alt={reply.author_name} /> : null}
                        <AvatarFallback className="text-[8px]">{reply.author_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-medium">{reply.author_name}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[8px]">A</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-medium">Administrator</span>
                    </div>
                  )}
                  <span className="text-[9px] text-muted-foreground">{relativeTime(reply.created_at)}</span>
                  {reply.edited_at && (
                    <span className="text-[9px] text-muted-foreground italic">(edited {relativeTime(reply.edited_at)})</span>
                  )}
                </div>

                {/* Desktop: vertical sidebar */}
                <div className="hidden md:block md:border-r md:pr-1.5">
                  {reply.author_id ? (
                    <a href={`/profile/${reply.author_id}`} className="flex flex-col items-center gap-0.5 text-center hover:underline">
                      <Avatar className="h-6 w-6">
                        {reply.author_avatar_url ? <AvatarImage src={reply.author_avatar_url} alt={reply.author_name} /> : null}
                        <AvatarFallback className="text-[9px]">{reply.author_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-medium leading-none truncate max-w-[80px]">{reply.author_name}</span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-center">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px]">A</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-medium">Administrator</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center text-[9px] text-muted-foreground leading-tight">
                    {reply.author_unlock_tier_label && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-1 py-0 font-medium text-amber-200 text-[9px]">
                        <span aria-hidden>{reply.author_unlock_tier_icon ?? "💸"}</span>
                        <span className="truncate">{reply.author_unlock_tier_label}</span>
                      </span>
                    )}
                    <span>{reply.author_post_count} posts</span>
                  </div>
                  <div className="text-center text-[9px] text-muted-foreground leading-none">
                    {relativeTime(reply.created_at)}
                  </div>
                  {reply.edited_at && (
                    <div className="text-center text-[9px] text-muted-foreground leading-none italic">
                      (edited {relativeTime(reply.edited_at)})
                    </div>
                  )}
                </div>

                {/* Right: content */}
                <div>
                  {editing ? (
                    <div className="space-y-2">
                      <MarkdownEditor
                        value={editBody}
                        onChange={setEditBody}
                        rows={4}
                      />
                      {error && <div className="text-xs text-red-600">{error}</div>}
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={handleEdit} disabled={editSaving || !editBody.trim()}>
                          {editSaving ? "Saving…" : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <MarkdownBody content={reply.body} authorTrustLevel={reply.author_trust_level} />
                      <Reactions targetType="reply" targetId={reply.id} userId={userId} authorId={reply.author_id} />

                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {userId && !isLocked && (
                          <>
                            <button
                              onClick={() => setShowReplyForm(!showReplyForm)}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Reply
                            </button>
                            <button
                              onClick={handleQuote}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                            >
                              <QuoteIcon className="h-3 w-3" />
                              Quote
                            </button>
                          </>
                        )}
                        {isAuthor && !isLocked && (
                          <>
                            <button
                              onClick={() => { setEditBody(reply.body); setEditing(true); }}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              onClick={handleDelete}
                              className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </>
                        )}
                        {userId && (
                          <button
                            onClick={() => setShowReport(true)}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
                          >
                            <Flag className="h-3 w-3" />
                            Report
                          </button>
                        )}
                        {/* Mark as solution: thread author or admin can mark */}
                        {userId && (userId === threadAuthorId || isAdmin) && solutionReplyId !== reply.id && (
                          <button
                            onClick={() => onMarkSolution(reply.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-500 transition"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Mark solution
                          </button>
                        )}
                        {solutionReplyId === reply.id && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Solution
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {showReplyForm && !isLocked && (
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
            </div>
          </div>
        </CardContent>
      </Card>

      {showReport && (
        <ReportModal
          targetType="reply"
          targetId={reply.id}
          onClose={() => setShowReport(false)}
        />
      )}

      {!collapsed &&
        reply.children.map((child) => (
          <ReplyCard
            key={child.id}
            reply={child}
            depth={depth + 1}
            userId={userId}
            threadId={threadId}
            isLocked={isLocked}
            isAdmin={isAdmin}
            onReplyPosted={onReplyPosted}
            onQuote={onQuote}
            threadAuthorId={threadAuthorId}
            solutionReplyId={solutionReplyId}
            onMarkSolution={onMarkSolution}
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
  authorTrustLevels = {},
  authorProfiles = {},
  isLocked = false,
  isAdmin = false,
  onQuoteToMain,
  onExternalRefresh,
  threadAuthorId,
  solutionReplyId,
}: {
  replies: Array<{
    id: string;
    body: string;
    author_id: string;
    created_at: string;
    parent_reply_id: string | null;
    deleted_at?: string | null;
  }>;
  userId: string | null;
  threadId: string;
  authorNames: Record<string, string>;
  authorTrustLevels?: Record<string, number>;
  authorProfiles?: Record<string, { avatar_url: string | null; post_count: number; unlock_tier_label: string | null; unlock_tier_icon: string | null }>;
  isLocked?: boolean;
  isAdmin?: boolean;
  onQuoteToMain?: (text: string) => void;
  onExternalRefresh?: number;
  threadAuthorId?: string | null;
  solutionReplyId?: string | null;
}) {
  const router = useRouter();
  const [replyData, setReplyData] = useState(replies);
  const [userId, setUserId] = useState<string | null>(serverUserId);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [currentSolutionId, setCurrentSolutionId] = useState<string | null>(solutionReplyId ?? null);
  const REPLIES_PER_PAGE = 15;
  const [visibleCount, setVisibleCount] = useState(REPLIES_PER_PAGE);

  type SortMode = "oldest" | "newest" | "reactions";
  const [sortMode, setSortMode] = useState<SortMode>("oldest");

  async function handleMarkSolution(replyId: string) {
    const supabase = supabaseBrowser();
    const newId = currentSolutionId === replyId ? null : replyId;
    const { error } = await supabase
      .from("forum_threads")
      .update({ solution_reply_id: newId })
      .eq("id", threadId);
    if (error) {
      toast.error("Failed to mark solution");
      return;
    }
    setCurrentSolutionId(newId);
    toast.success(newId ? "Marked as solution" : "Solution unmarked");
  }

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

  // Fetch reaction counts per reply for sorting
  useEffect(() => {
    async function fetchReactionCounts() {
      const supabase = supabaseBrowser();
      const replyIds = replyData.map((r) => r.id);
      if (replyIds.length === 0) return;
      const { data } = await supabase
        .from("forum_reactions")
        .select("target_id")
        .eq("target_type", "reply")
        .in("target_id", replyIds);
      const counts: Record<string, number> = {};
      for (const r of (data ?? []) as any[]) {
        counts[r.target_id] = (counts[r.target_id] || 0) + 1;
      }
      setReactionCounts(counts);
    }
    fetchReactionCounts();
  }, [replyData]);

  // Refresh replies when external trigger fires
  useEffect(() => {
    if (onExternalRefresh && onExternalRefresh > 0) {
      refreshReplies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onExternalRefresh]);

  async function refreshReplies() {
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from("forum_replies")
      .select("id, body, author_id, created_at, edited_at, parent_reply_id, deleted_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (data) {
      setReplyData(data as any[]);
      // Show all replies after refresh to include new one
      setVisibleCount(Math.max(visibleCount, (data as any[]).length));
    }

    router.refresh();
  }

  const repliesWithNames = replyData.map((r) => ({
    ...r,
    deleted_at: (r as any).deleted_at ?? null,
    edited_at: (r as any).edited_at ?? null,
    author_name: authorNames[r.author_id] || (r.author_id ? "Anonymous" : "Administrator"),
    author_trust_level: authorTrustLevels[r.author_id] ?? 0,
    author_avatar_url: authorProfiles[r.author_id]?.avatar_url ?? null,
    author_post_count: authorProfiles[r.author_id]?.post_count ?? 0,
    author_unlock_tier_label: authorProfiles[r.author_id]?.unlock_tier_label ?? null,
    author_unlock_tier_icon: authorProfiles[r.author_id]?.unlock_tier_icon ?? null,
  }));

  const tree = buildTree(repliesWithNames);

  // Sort root-level replies based on selected mode
  const sortedTree = useMemo(() => {
    const roots = [...tree];
    if (sortMode === "newest") {
      roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortMode === "reactions") {
      roots.sort((a, b) => (reactionCounts[b.id] ?? 0) - (reactionCounts[a.id] ?? 0));
    }
    // "oldest" is default DB order (ascending), no sort needed
    return roots;
  }, [tree, sortMode, reactionCounts]);

  if (sortedTree.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No replies yet.
        </CardContent>
      </Card>
    );
  }

  const visibleRoots = sortedTree.slice(0, visibleCount);
  const totalRoots = sortedTree.length;
  const hasMore = visibleCount < totalRoots;

  return (
    <div className="space-y-0">
      {/* Sort pills */}
      <div className="flex items-center gap-2 mb-3">
        {(["oldest", "newest", "reactions"] as const).map((s) => {
          const label = s === "oldest" ? "Oldest first" : s === "newest" ? "Newest first" : "Most reactions";
          const isActive = sortMode === s;
          return (
            <button
              key={s}
              onClick={() => { setSortMode(s); setVisibleCount(REPLIES_PER_PAGE); }}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {totalRoots > REPLIES_PER_PAGE && (
        <div className="text-xs text-muted-foreground mb-2">
          Showing {Math.min(visibleCount, totalRoots)} of {totalRoots} replies
        </div>
      )}
      {visibleRoots.map((node) => (
        <ReplyCard
          key={node.id}
          reply={node}
          depth={0}
          userId={userId}
          threadId={threadId}
          isLocked={isLocked}
          isAdmin={isAdmin}
          onReplyPosted={refreshReplies}
          onQuote={(text) => onQuoteToMain?.(text)}
          threadAuthorId={threadAuthorId ?? null}
          solutionReplyId={currentSolutionId}
          onMarkSolution={handleMarkSolution}
        />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((c) => c + REPLIES_PER_PAGE)}
          >
            Load more replies ({totalRoots - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
