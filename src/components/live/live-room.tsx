"use client";

import { LiveRoomManual } from "@/components/live/live-room-manual";

export function LiveRoom(props: {
  roomId: string;
  hostUserId: string;
  hostName: string;
  hostAvatarUrl: string | null;
  hostUsername: string | null;
  currentUserId: string | null;
}) {
  return <LiveRoomManual {...props} />;
}
