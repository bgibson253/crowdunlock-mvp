import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { ThreadContent } from "@/components/forum/thread-content";
import { AuthorCard } from "@/components/forum/author-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownBody } from "@/components/forum/markdown-body";
import { Reactions } from "@/components/forum/reactions";
import { FavoriteButton } from "@/components/forum/favorite-button";
import { SubscribeButton } from "@/components/forum/subscribe-button";
import { ShareButton } from "@/components/forum/share-button";

import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/forum/breadcrumbs";
import { ThreadActions } from "@/components/forum/thread-actions";
import { relativeTime } from "@/lib/relative-time";
import { Eye, Lock } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("forum_threads")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.title ?? "Thread",
  };
}

export const dynamic = "force-dynamic";

async function getAuthorProfile(supabase: any, authorId: string | null) {
  if (!authorId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,post_count,trust_level")
    .eq("id", authorId)
    .maybeSingle();
  if (!data) return null;

  const { fetchProfileBadge } = await import("@/lib/profile-badges");
  const badge = await fetchProfileBadge(supabase, authorId);

  return {
    ...data,
    unlock_tier_label: badge?.unlock_tier_label ?? null,
    unlock_tier_icon: badge?.unlock_tier_icon ?? null,
  };
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await supabaseServer();

  // Increment view count
  await supabase.rpc("increment_thread_view", { p_thread_id: id });

  const { data: thread, error: threadErr } = await supabase
    .from("forum_threads")
    .select("id,title,body,created_at,edited_at,author_id,section_id,view_count,locked,pinned,deleted_at,solution_reply_id")
    .eq("id", id)
    .maybeSingle();

  if (threadErr) throw new Error(threadErr.message);
  if (!thread) return notFound();

  // Get section name for breadcrumbs
  let sectionName = "Forum";
  if (thread.section_id) {
    const { data: section } = await supabase
      .from("forum_sections")
      .select("name")
      .eq("id", thread.section_id)
      .maybeSingle();
    if (section) sectionName = section.name;
  }

  const { data: replies, error: repliesErr } = await supabase
    .from("forum_replies")
    .select("id,body,created_at,edited_at,author_id,parent_reply_id,deleted_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  if (repliesErr) throw new Error(repliesErr.message);

  const threadAuthor = await getAuthorProfile(supabase, thread.author_id);

  // Build profile map for replies
  const replyAuthorIds = Array.from(
    new Set((replies ?? []).map((r: any) => r.author_id).filter(Boolean)),
  ) as string[];

  const { data: replyProfilesRaw } = replyAuthorIds.length
    ? await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,post_count,trust_level")
        .in("id", replyAuthorIds)
    : { data: [] as any[] };

  const { fetchProfileBadge } = await import("@/lib/profile-badges");
  const badgeById = new Map<string, any>();
  await Promise.all(
    replyAuthorIds.map(async (uid) => {
      const b = await fetchProfileBadge(supabase, uid);
      badgeById.set(uid, b);
    }),
  );

  const replyProfiles = (replyProfilesRaw ?? []).map((p: any) => {
    const b = badgeById.get(p.id) ?? null;
    return {
      ...p,
      unlock_tier_label: b?.unlock_tier_label ?? null,
      unlock_tier_icon: b?.unlock_tier_icon ?? null,
    };
  });

  const replyProfileById = new Map<string, any>();
  (replyProfiles ?? []).forEach((p: any) => replyProfileById.set(p.id, p));

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;

  // Check if user is admin
  let isAdmin = false;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    isAdmin = profile?.is_admin ?? false;
  }

  // Get author names for threaded replies
  const authorIds = [
    thread.author_id,
    ...new Set((replies ?? []).map((r: any) => r.author_id)),
  ].filter(Boolean);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, trust_level, avatar_url, post_count")
    .in("id", authorIds);

  const authorNames: Record<string, string> = {};
  const authorTrustLevels: Record<string, number> = {};
  const authorProfiles: Record<string, { avatar_url: string | null; post_count: number; unlock_tier_label: string | null; unlock_tier_icon: string | null }> = {};

  const allBadgeMap = new Map<string, any>();
  if (thread.author_id && !badgeById.has(thread.author_id)) {
    const b = await fetchProfileBadge(supabase, thread.author_id);
    allBadgeMap.set(thread.author_id, b);
  }
  for (const [uid, b] of badgeById) {
    allBadgeMap.set(uid, b);
  }

  for (const p of (profiles ?? []) as any[]) {
    authorNames[p.id] = p.display_name || p.username || "Anonymous";
    authorTrustLevels[p.id] = p.trust_level ?? 0;
    const badge = allBadgeMap.get(p.id) ?? null;
    authorProfiles[p.id] = {
      avatar_url: p.avatar_url ?? null,
      post_count: p.post_count ?? 0,
      unlock_tier_label: badge?.unlock_tier_label ?? null,
      unlock_tier_icon: badge?.unlock_tier_icon ?? null,
    };
  }

  const isDeleted = !!thread.deleted_at;
  const isLocked = thread.locked ?? false;

  return (
    <div className="relative isolate min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Forum", href: "/forum" },
            ...(thread.section_id
              ? [{ label: sectionName, href: `/forum/s/${thread.section_id}` }]
              : []),
            { label: isDeleted ? "[deleted]" : thread.title },
          ]}
        />

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isLocked && <Lock className="h-4 w-4 text-red-400 shrink-0" />}
                <CardTitle>{isDeleted ? "[deleted]" : thread.title}</CardTitle>
              </div>
              {!isDeleted && (
                <ThreadActions
                  threadId={thread.id}
                  authorId={thread.author_id}
                  userId={userId}
                  isAdmin={isAdmin}
                  isLocked={isLocked}
                  isPinned={thread.pinned ?? false}
                  threadTitle={thread.title}
                  threadBody={thread.body}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-[90px_1fr]">
            {/* Mobile: horizontal author row */}
            <div className="md:hidden flex items-center gap-2 pb-2 border-b mb-2">
              <AuthorCard author={threadAuthor} compact />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{relativeTime(thread.created_at)}</span>
                {thread.edited_at && (
                  <span className="italic">(edited {relativeTime(thread.edited_at)})</span>
                )}
                <span className="inline-flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {thread.view_count ?? 0}
                </span>
              </div>
            </div>
            {/* Desktop: sidebar */}
            <div className="hidden md:block md:border-r md:pr-1.5">
              <AuthorCard author={threadAuthor} compact />
              <div className="text-center text-[9px] text-muted-foreground leading-none mt-0.5">
                {relativeTime(thread.created_at)}
              </div>
              {thread.edited_at && (
                <div className="text-center text-[9px] text-muted-foreground leading-none mt-0.5 italic">
                  (edited {relativeTime(thread.edited_at)})
                </div>
              )}
              <div className="text-center text-[9px] text-muted-foreground leading-none mt-0.5 flex items-center justify-center gap-0.5">
                <Eye className="h-3 w-3" />
                {thread.view_count ?? 0}
              </div>
            </div>
            <div>
              {isDeleted ? (
                <p className="text-sm text-muted-foreground italic">[This thread has been deleted]</p>
              ) : (
                <>
                  <MarkdownBody content={thread.body} authorTrustLevel={threadAuthor?.trust_level ?? 0} />
                  <Reactions targetType="thread" targetId={thread.id} userId={userId} authorId={thread.author_id} />
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2">
                    <FavoriteButton threadId={thread.id} userId={userId} />
                    <SubscribeButton threadId={thread.id} userId={userId} />
                    <ShareButton threadId={thread.id} title={thread.title} />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {(replies?.filter((r: any) => !r.deleted_at).length ?? 0)} Repl{(replies?.filter((r: any) => !r.deleted_at).length ?? 0) === 1 ? "y" : "ies"}
          </h3>
        </div>

        {isLocked && (
          <Card>
            <CardContent className="py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-red-400" />
              This thread is locked. No new replies can be posted.
            </CardContent>
          </Card>
        )}

        <ThreadContent
          replies={(replies ?? []) as any[]}
          userId={userId}
          threadId={id}
          authorNames={authorNames}
          authorTrustLevels={authorTrustLevels}
          authorProfiles={authorProfiles}
          isLocked={isLocked}
          isAdmin={isAdmin}
          isAuthenticated={!!authData.user}
          threadAuthorId={thread.author_id}
          solutionReplyId={thread.solution_reply_id ?? null}
        />
      </div>
    </div>
  );
}
