"use client";

import { LiveRoomSfu } from "@/components/live/sfu/live-room-sfu";

export function LiveRoom(props: {
  roomId: string;
  hostUserId: string;
  sfuRegion?: "use1" | "usw2" | null;
  hostName: string;
  hostAvatarUrl: string | null;
  hostUsername: string | null;
  currentUserId: string | null;
  currentUsername?: string | null;
  currentAvatarUrl?: string | null;
}) {
  // SFU only.
  // Host should auto-start (with a single user gesture) when viewing their own room.
  const isHost = !!props.currentUserId && props.currentUserId === props.hostUserId;
  return (
    <LiveRoomSfu
      roomId={props.roomId}
      mode={isHost ? "host" : "viewer"}
      preferredRegion={props.sfuRegion ?? undefined}
      me={
        props.currentUserId
          ? {
              id: props.currentUserId,
              username: props.currentUsername || "me",
              avatarUrl: props.currentAvatarUrl ?? null,
            }
          : null
      }
      host={{
        id: props.hostUserId,
        username: props.hostUsername || "",
        displayName: props.hostName,
        avatarUrl: props.hostAvatarUrl,
      }}
    />
  );
}
