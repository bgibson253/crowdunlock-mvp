import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rss, UserPlus } from "lucide-react";
import { relativeTime } from "@/lib/relative-time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Feed",
  description: "Content from people you follow on Unmaskr.",
};

const PAGE_SIZE = 20;

type FeedItem = {
  type: "upload" | "thread";
  id: string;
  title: string;
  preview: string | null;
  created_at: string;
  author_id: string;
  author_username: string | null;
  author_avatar: string | null;
  // upload-specific
  funding_goal?: number | null;
  current_funded?: number | null;
  status?: string;
  // thread-specific
  section_id?: string;
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/feed");

  // Get followed user IDs
  const { data: follows } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = (follows ?? []).map((f: any) => f.following_id);

  if (followedIds.length === 0) {
    return (
      <main className="relative isolate min-h-screen">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-2xl px-4 py-20">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Your feed is empty</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Follow other users to see their uploads and forum threads here. Visit profiles and hit the Follow button.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/browse">Browse uploads</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/forum">Visit forum</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Fetch uploads from followed users
  const { data: uploads } = await supabase
    .from("uploads")
    .select("id, title, ai_teaser, created_at, uploader_id, funding_goal, current_funded, status")
    .in("uploader_id", followedIds)
    .in("status", ["funding", "unlocked"])
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE * 2);

  // Fetch threads from followed users
  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id, title, body, created_at, author_id, section_id")
    .in("author_id", followedIds)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE * 2);

  // Get profiles for followed users
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", followedIds);

  const profileMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
  for (const p of (profiles ?? []) as any[]) {
    profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
  }

  // Merge and sort
  const feedItems: FeedItem[] = [];

  for (const u of (uploads ?? []) as any[]) {
    const prof = profileMap[u.uploader_id];
    feedItems.push({
      type: "upload",
      id: u.id,
      title: u.title,
      preview: u.ai_teaser,
      created_at: u.created_at,
      author_id: u.uploader_id,
      author_username: prof?.username ?? null,
      author_avatar: prof?.avatar_url ?? null,
      funding_goal: u.funding_goal,
      current_funded: u.current_funded,
      status: u.status,
    });
  }

  for (const t of (threads ?? []) as any[]) {
    const prof = profileMap[t.author_id];
    feedItems.push({
      type: "thread",
      id: t.id,
      title: t.title,
      preview: t.body?.slice(0, 200) ?? null,
      created_at: t.created_at,
      author_id: t.author_id,
      author_username: prof?.username ?? null,
      author_avatar: prof?.avatar_url ?? null,
      section_id: t.section_id,
    });
  }

  feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const paginated = feedItems.slice(offset, offset + PAGE_SIZE);
  const hasMore = feedItems.length > offset + PAGE_SIZE;

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-2">
          <Rss className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Your Feed</h1>
        </div>

        <div className="space-y-4">
          {paginated.map((item) => (
            <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
              {item.type === "upload" && (
                <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
              )}
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Link href={`/profile/${item.author_id}`}>
                    <Avatar className="h-9 w-9 shrink-0">
                      {item.author_avatar ? (
                        <AvatarImage src={item.author_avatar} alt={item.author_username ?? "User"} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {(item.author_username ?? "U").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${item.author_id}`}
                        className="text-sm font-semibold hover:underline truncate"
                      >
                        {item.author_username ?? "User"}
                      </Link>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {item.type === "upload" ? "📤 Upload" : "💬 Thread"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {relativeTime(item.created_at)}
                      </span>
                    </div>

                    <Link
                      href={item.type === "upload" ? `/uploads/${item.id}` : `/forum/${item.id}`}
                      className="block group"
                    >
                      <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.preview && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                          {item.preview}
                        </p>
                      )}
                    </Link>

                    {item.type === "upload" && item.funding_goal && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            ${Math.floor((item.current_funded ?? 0) / 100)} / $
                            {Math.floor(item.funding_goal / 100)}
                          </span>
                          <span>
                            {Math.min(
                              100,
                              Math.round(
                                ((item.current_funded ?? 0) / item.funding_goal) * 100
                              )
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            100,
                            Math.round(
                              ((item.current_funded ?? 0) / item.funding_goal) * 100
                            )
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {(page > 1 || hasMore) && (
          <div className="flex items-center justify-center gap-3 pt-4">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={page === 2 ? "/feed" : `/feed?page=${page - 1}`}>← Previous</Link>
              </Button>
            )}
            <span className="text-xs text-muted-foreground">Page {page}</span>
            {hasMore && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/feed?page=${page + 1}`}>Next →</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
