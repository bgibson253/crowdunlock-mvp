import { redirect } from "next/navigation";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LiveHostPanel } from "@/components/live/live-host-panel";

export const dynamic = "force-dynamic";

export default async function LiveHomePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/live");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your stream, or watch people you follow.
        </p>
      </div>

      {!profile?.username ? (
        <Card>
          <CardHeader>
            <CardTitle>Pick a username first</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You need a username before you can go live.
            <div className="mt-3">
              <Button asChild>
                <Link href="/profile/settings">Set username</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <LiveHostPanel username={profile.username} />
      )}
    </div>
  );
}
