import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SendDmButton } from "@/components/forum/send-dm-button";

export const dynamic = "force-dynamic";

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
    .select("id,username,display_name,bio,website,location,twitter,github,linkedin,banner_url,avatar_url,post_count,created_at")
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

  return (
    <main className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
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
                      <SendDmButton recipientId={id} recipientName={name} />
                    )}
                    {isOwnProfile && (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/profile/settings">Edit profile</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{profile.post_count ?? 0} posts</span>
                {profile.location && <span>📍 {profile.location}</span>}
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>

              {profile.bio && (
                <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{profile.bio}</p>
              )}

              {(profile.website || profile.twitter || profile.github || profile.linkedin) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {profile.website && (
                    <a className="text-indigo-600 hover:underline" href={profile.website} target="_blank" rel="noreferrer">
                      🌐 Website
                    </a>
                  )}
                  {profile.twitter && <span>𝕏 {profile.twitter}</span>}
                  {profile.github && (
                    <a className="text-indigo-600 hover:underline" href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  )}
                  {profile.linkedin && <span>LinkedIn: {profile.linkedin}</span>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Threads Section */}
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

        {/* Replies Section */}
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
                      className="text-xs text-indigo-600 hover:underline line-clamp-1"
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
      </div>
    </main>
  );
}
