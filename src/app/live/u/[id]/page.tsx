import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { LiveRoom } from "@/components/live/live-room";

export const dynamic = "force-dynamic";

export default async function LiveByUserIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meProfile } = user
    ? await supabase
        .from("profiles")
        .select("id,username,avatar_url")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: host } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .eq("id", id)
    .maybeSingle();

  if (!host) return notFound();

  const { data: room } = await supabase
    .from("live_rooms")
    .select("id,title,status,started_at,sfu_region")
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

  const isHost = !!user && user.id === host.id;

  // When the stream is ended, do not mount the LiveRoom component (prevents frozen last frame).
  if (!room) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {host.display_name || host.username || "Creator"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isHost ? "You are offline." : "Not live right now."}
          </p>
        </div>
      </div>
    );
  }

  const roomId = room.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {room?.title || `${host.display_name || host.username || "Creator"} is live`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Live host: {host.display_name || host.username || host.id}
        </p>
      </div>

      {user ? (
        <LiveRoom
          roomId={roomId}
          hostUserId={host.id}
          sfuRegion={(room as any)?.sfu_region ?? null}
          hostName={host.display_name || host.username || "Host"}
          hostAvatarUrl={host.avatar_url}
          hostUsername={host.username}
          currentUserId={user.id}
          currentUsername={meProfile?.username ?? null}
          currentAvatarUrl={meProfile?.avatar_url ?? null}
        />
      ) : (
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          Sign in to watch.
        </div>
      )}
    </div>
  );
}
