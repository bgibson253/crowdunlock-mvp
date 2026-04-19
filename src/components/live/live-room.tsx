"use client";

import { LiveRoomSfu } from "@/components/live/sfu/live-room-sfu";

export function LiveRoom(props: {
  roomId: string;
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  hostUsername: string | null;
  currentUserId: string | null;
}) {
  void props;
  // SFU only. No LiveKit fallback.
  return <LiveRoomSfu roomId={props.roomId} />;
}
