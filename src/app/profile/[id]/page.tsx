import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SendDmButton } from "@/components/forum/send-dm-button";
import { UserFavoriteButton } from "@/components/forum/user-favorite-button";
import { UserSubscribeButton } from "@/components/forum/user-subscribe-button";
import { BlockUserButton } from "@/components/forum/block-user-button";
import { AchievementBadges } from "@/components/engagement/achievement-badges";
import { StreakIndicator } from "@/components/engagement/streak-indicator";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { relativeTime } from "@/lib/relative-time";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("display_name,username,bio")
    .eq("id", id)
    .maybeSingle();
  const name = data?.display_name ?? data?.username ?? "User";
  const description = data?.bio?.slice(0, 160) ?? `${name}'s profile on Unmaskr.`;
  return {
    title: `${name}'s Profile`,
    description,
    openGraph: {
      title: `${name} on Unmaskr`,
      description,
      type: "profile",
      siteName: "Unmaskr",
      url: `https://crowdunlock-mvp.vercel.app/profile/${id}`,
    },
    twitter: {
      card: "summary",
      title: `${name} on Unmaskr`,
      description,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();

  // Gate behind auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?redirect=${encodeURIComponent(`/profile/${id}`)}`);
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,twitter,instagram,tiktok,reddit,banner_url,avatar_url,post_count,total_points,current_streak,created_at,last_seen_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!profile) return notFound();

  const name = profile.display_name ?? profile.username ?? "User";

  // Fetch user's threads
  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id, title, section_id, created_at")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch user's replies (with thread title)
  const { data: replies } = await supabase
    .from("forum_replies")
    .select("id, body, thread_id, created_at")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get thread titles for replies
  const threadIds = Array.from(new Set((replies ?? []).map((r: any) => r.thread_id)));
  const { data: replyThreads } = threadIds.length
    ? await supabase
        .from("forum_threads")
        .select("id, title")
        .in("id", threadIds)
    : { data: [] as any[] };

  const threadTitleMap: Record<string, string> = {};
  for (const t of (replyThreads ?? []) as any[]) {
    threadTitleMap[t.id] = t.title;
  }

  // Fetch sections for display
  const { data: sections } = await supabase
    .from("forum_sections")
    .select("id, name");
  const sectionMap: Record<string, string> = {};
  for (const s of (sections ?? []) as any[]) {
    sectionMap[s.id] = s.name;
  }

  // DM button / edit profile logic
  const isOwnProfile = user?.id === id;

  // Online status
  const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at) : null;
  const isOnline = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000; // within 5 min

  // Check if current user has blocked this profile
  let isBlocked = false;
  if (user && !isOwnProfile) {
    const { data: blockRow } = await supabase
      .from("user_blocks")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", id)
      .maybeSingle();
    isBlocked = !!blockRow;
  }

  // Total reactions received
  const allThreadIds = Array.from(new Set((threads ?? []).map((t: any) => t.id)));
  const allReplyIds = Array.from(new Set((replies ?? []).map((r: any) => r.id)));

  let totalReactionsReceived = 0;
  if (allThreadIds.length > 0) {
    const { count: threadReactions } = await supabase
      .from("forum_reactions")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "thread")
      .in("target_id", allThreadIds);
    totalReactionsReceived += threadReactions ?? 0;
  }
  if (allReplyIds.length > 0) {
    const { count: replyReactions } = await supabase
      .from("forum_reactions")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "reply")
      .in("target_id", allReplyIds);
    totalReactionsReceived += replyReactions ?? 0;
  }

  return (
    <main className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-0">
            {profile.banner_url ? (
              <div className="h-32 w-full overflow-hidden rounded-t-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.banner_url} alt="Banner" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-32 w-full rounded-t-xl bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-amber-100" />
            )}

            <div className="-mt-10 px-6 pb-6">
              <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 border-4 border-background">
                  {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
                  <AvatarFallback className="text-lg">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-semibold leading-6">{name}</h1>
                      {profile.username && profile.username !== name && (
                        <div className="text-sm text-muted-foreground">@{profile.username}</div>
                      )}
                    </div>
                    {user && !isOwnProfile && (
                      <div className="flex items-center gap-1">
                        <SendDmButton recipientId={id} recipientName={name} />
                      </div>
                    )}
                    {isOwnProfile && (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/profile/settings">Edit profile</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {!isOwnProfile && (
                <div className="mt-3 flex items-center gap-1">
                  <UserFavoriteButton targetUserId={id} />
                  <UserSubscribeButton targetUserId={id} />
                  <BlockUserButton targetUserId={id} targetName={name} isBlocked={isBlocked} />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {isOnline ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </>
                  ) : lastSeen ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                      Last seen {relativeTime(profile.last_seen_at)}
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                      Never seen
                    </>
                  )}
                </span>
                <span>{profile.post_count ?? 0} posts</span>
                <span>⭐ {(profile.total_points ?? 0).toLocaleString()} points</span>
                <span>❤️ {totalReactionsReceived} reactions</span>
                <StreakIndicator userId={id} />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>

              {/* Achievement badges */}
              <div className="mt-3">
                <AchievementBadges userId={id} limit={8} />
              </div>

              {profile.bio && (
                <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{profile.bio}</p>
              )}

              {(profile.twitter || profile.instagram || profile.tiktok || profile.reddit) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {profile.twitter && (
                    <a className="text-primary hover:underline" href={`https://x.com/${profile.twitter}`} target="_blank" rel="noreferrer">
                      𝕏 @{profile.twitter}
                    </a>
                  )}
                  {profile.instagram && (
                    <a className="text-primary hover:underline" href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer">
                      📷 @{profile.instagram}
                    </a>
                  )}
                  {profile.tiktok && (
                    <a className="text-primary hover:underline" href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noreferrer">
                      🎵 @{profile.tiktok}
                    </a>
                  )}
                  {profile.reddit && (
                    <a className="text-primary hover:underline" href={`https://reddit.com/u/${profile.reddit}`} target="_blank" rel="noreferrer">
                      🟠 u/{profile.reddit}
                    </a>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabbed sections: Activity / Threads / Replies */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="threads">Threads ({(threads ?? []).length})</TabsTrigger>
            <TabsTrigger value="replies">Replies ({(replies ?? []).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed userId={id} isOwnProfile={isOwnProfile} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threads">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Threads ({(threads ?? []).length})</CardTitle>
              </CardHeader>
              <CardContent>
                {(threads ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No threads yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(threads as any[]).map((t) => (
                      <div key={t.id} className="flex items-start justify-between gap-2 py-2 border-b last:border-0">
                        <div className="min-w-0">
                          <Link href={`/forum/${t.id}`} className="text-sm font-medium hover:underline line-clamp-1">
                            {t.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {t.section_id && sectionMap[t.section_id] && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {sectionMap[t.section_id]}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(t.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="replies">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Replies ({(replies ?? []).length})</CardTitle>
              </CardHeader>
              <CardContent>
                {(replies ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No replies yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(replies as any[]).map((r) => (
                      <div key={r.id} className="py-2 border-b last:border-0">
                        <Link
                          href={`/forum/${r.thread_id}`}
                          className="text-xs text-primary hover:underline line-clamp-1"
                        >
                          {threadTitleMap[r.thread_id] ?? "Thread"}
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {r.body}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
