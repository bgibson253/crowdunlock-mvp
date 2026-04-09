import { redirect } from "next/navigation";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UnblockButton } from "@/components/forum/unblock-button";
import { Breadcrumbs } from "@/components/forum/breadcrumbs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blocked Users",
  description: "Manage your blocked users list.",
};

export default async function BlockedUsersPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=/profile/settings/blocked");

  const { data: blocks } = await supabase
    .from("user_blocks")
    .select("id, blocked_id, created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  const blockedIds = (blocks ?? []).map((b: any) => b.blocked_id);
  const { data: profiles } = blockedIds.length
    ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", blockedIds)
    : { data: [] as any[] };

  const profileMap: Record<string, any> = {};
  for (const p of (profiles ?? []) as any[]) {
    profileMap[p.id] = p;
  }

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Settings", href: "/profile/settings" },
            { label: "Blocked Users" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blocked Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Blocked users cannot see your content, and their content is hidden from you.
          </p>
        </div>

        {(blocks ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              You haven&apos;t blocked anyone yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {(blocks as any[]).map((block) => {
              const profile = profileMap[block.blocked_id];
              const name = profile?.display_name || profile?.username || "Unknown";
              return (
                <Card key={block.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {profile?.avatar_url ? (
                          <AvatarImage src={profile.avatar_url} alt={name} />
                        ) : null}
                        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/profile/${block.blocked_id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          Blocked {new Date(block.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <UnblockButton blockId={block.id} userName={name} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
