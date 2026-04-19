import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { LiveRoom } from "@/components/live/live-room";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LiveByUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await supabaseServer();

  // Must be signed in to view live (keeps abuse down & matches rest of app gating).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to watch live</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Live streams are available to signed-in users.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: host } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (!host) return notFound();

  const { data: room } = await supabase
    .from("live_rooms")
    .select("id,title,status,started_at")
    .eq("host_user_id", host.id)
    .eq("status", "live")
    .maybeSingle();

  if (!room) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {host.display_name || host.username}
          </h1>
          <p className="text-sm text-muted-foreground">Not live right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {room.title || `${host.display_name || host.username} is live`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Live host: {host.display_name || host.username}
        </p>
      </div>

      <LiveRoom
        roomId={room.id}
        hostUserId={host.id}
        hostName={host.display_name || host.username || "Host"}
        hostAvatarUrl={host.avatar_url}
        hostUsername={host.username}
        currentUserId={user.id}
      />

      <div className="text-xs text-muted-foreground">
        Tip + paid questions UI coming next.
      </div>
    </div>
  );
}
