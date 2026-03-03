import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { ReplyForm } from "@/components/forum/reply-form";
import { ReplyFormGate } from "@/components/forum/reply-form-gate";
import { AuthorCard } from "@/components/forum/author-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownBody } from "@/components/forum/markdown-body";
import { Reactions } from "@/components/forum/reactions";
import { FavoriteButton } from "@/components/forum/favorite-button";
import { SubscribeButton } from "@/components/forum/subscribe-button";
import { ThreadedReplies } from "@/components/forum/threaded-replies";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

async function getAuthorProfile(supabase: any, authorId: string | null) {
  if (!authorId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,post_count")
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

  const { data: thread, error: threadErr } = await supabase
    .from("forum_threads")
    .select("id,title,body,created_at,author_id")
    .eq("id", id)
    .maybeSingle();

  if (threadErr) throw new Error(threadErr.message);
  if (!thread) return notFound();

  const { data: replies, error: repliesErr } = await supabase
    .from("forum_replies")
    .select("id,body,created_at,author_id,parent_reply_id")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  if (repliesErr) throw new Error(repliesErr.message);

  const threadAuthor = await getAuthorProfile(supabase, thread.author_id);

  // Build profile map for replies (avoid schema-cache relationship issues)
  const replyAuthorIds = Array.from(
    new Set((replies ?? []).map((r: any) => r.author_id).filter(Boolean)),
  ) as string[];

  const { data: replyProfilesRaw } = replyAuthorIds.length
    ? await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,post_count")
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

  // Get author names for threaded replies
  const authorIds = [
    thread.author_id,
    ...new Set((replies ?? []).map((r: any) => r.author_id)),
  ].filter(Boolean);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("id", authorIds);

  const authorNames: Record<string, string> = {};
  for (const p of (profiles ?? []) as any[]) {
    authorNames[p.id] = p.display_name || p.username || "Anonymous";
  }

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{thread.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="md:border-r md:pr-4">
              <AuthorCard author={threadAuthor} />
              <div className="mt-3 text-xs text-muted-foreground">
                {new Date(thread.created_at).toLocaleString()}
              </div>
            </div>
            <div>
              <MarkdownBody content={thread.body} />
              <Reactions targetType="thread" targetId={thread.id} userId={userId} />
              <Separator className="my-3" />
              <div className="flex items-center gap-2">
                <FavoriteButton threadId={thread.id} userId={userId} />
                <SubscribeButton threadId={thread.id} userId={userId} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {(replies?.length ?? 0)} Repl{(replies?.length ?? 0) === 1 ? "y" : "ies"}
          </h3>
        </div>

        <ThreadedReplies
          replies={(replies ?? []) as any[]}
          userId={userId}
          threadId={id}
          authorNames={authorNames}
        />

        {authData.user ? (
          <ReplyForm threadId={id} />
        ) : (
          <ReplyFormGate threadId={id} />
        )}
      </div>
    </div>
  );
}
