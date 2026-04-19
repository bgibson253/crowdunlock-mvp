import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { LiveRoom } from "@/components/live/live-room";

export const dynamic = "force-dynamic";

export default async function LiveByUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const uname = username.toLowerCase();

  const { data: host } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .ilike("username", uname)
    .maybeSingle();

  if (!host) return notFound();

  const isHost = !!user && user.id === host.id;

  const { data: room } = await supabase
    .from("live_rooms")
    .select("id,title,status,started_at")
    .eq("host_user_id", host.id)
    .eq("status", "live")
    .maybeSingle();

  if (!user && room) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-lg font-semibold">Sign in to watch live</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Live streams are available to signed-in users.
          </div>
        </div>
      </div>
    );
  }

  if (!room && !isHost) {
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

  const roomId = room?.id ?? `host-${host.id}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {room?.title || `${host.display_name || host.username} is live`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Live host: {host.display_name || host.username}
        </p>
      </div>

      <LiveRoom
        roomId={roomId}
        hostUserId={host.id}
        hostName={host.display_name || host.username || "Host"}
        hostAvatarUrl={host.avatar_url}
        hostUsername={host.username}
        currentUserId={user?.id ?? host.id}
      />
    </div>
  );
}
