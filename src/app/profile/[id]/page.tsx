import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,website,location,twitter,github,linkedin,banner_url,avatar_url,post_count,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!profile) return notFound();

  const name = profile.display_name ?? profile.username ?? "User";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.banner_url ? (
            <div className="h-28 w-full overflow-hidden border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.banner_url} alt="Banner" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-28 w-full border bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-amber-100" />
          )}

          <div className="-mt-10 flex items-end gap-4 px-4">
            <Avatar className="h-16 w-16 border bg-background">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <div className="text-xl font-semibold leading-6">{name}</div>
              <div className="text-sm text-muted-foreground">
                {profile.post_count ?? 0} posts
                {profile.location ? <span> · {profile.location}</span> : null}
              </div>
            </div>
          </div>

          {profile.bio ? (
            <div className="px-4 text-sm leading-6 whitespace-pre-wrap">{profile.bio}</div>
          ) : null}

          {(profile.website || profile.twitter || profile.github || profile.linkedin) ? (
            <div className="px-4 pb-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2">
              {profile.website ? (
                <a className="underline" href={profile.website} target="_blank" rel="noreferrer">
                  Website
                </a>
              ) : null}
              {profile.twitter ? <span>X: {profile.twitter}</span> : null}
              {profile.github ? <span>GitHub: {profile.github}</span> : null}
              {profile.linkedin ? <span>LinkedIn: {profile.linkedin}</span> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
