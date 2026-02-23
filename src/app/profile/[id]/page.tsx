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
    .select("id,username,avatar_url,post_count,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!profile) return notFound();

  const name = profile.username ?? "User";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-sm text-muted-foreground">
              {profile.post_count ?? 0} posts
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
