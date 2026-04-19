"use client";

import { LiveRoomManual } from "@/components/live/live-room-manual";
import { LiveRoomSfu } from "@/components/live/sfu/live-room-sfu";
import { envClient } from "@/lib/env";

export function LiveRoom(props: {
  roomId: string;
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  hostUsername: string | null;
  currentUserId: string | null;
}) {
  const env = envClient();
  const backend = env.NEXT_PUBLIC_LIVE_BACKEND ?? "livekit";

  if (backend === "sfu") {
    // SFU bootstrap UI (temporary). We only need roomId for now.
    return <LiveRoomSfu roomId={props.roomId} />;
  }

  return <LiveRoomManual {...props} />;
}
