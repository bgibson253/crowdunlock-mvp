import Link from "next/link";

import type { ReactNode } from "react";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type LiveRoom = { id: string; host_user_id: string; title: string | null };

type Upload = { id: string; title: string | null; uploader_id: string | null };

type FriendRequest = { id: string; from_user_id: string; to_user_id: string; status: string };

type Notification = {
  id: string;
  type: string;
  thread_id: string | null;
  created_at: string;
  metadata?: any;
};

export type NotificationContext = {
  profilesById: Record<string, Profile>;
  liveById: Record<string, LiveRoom>;
  uploadsById: Record<string, Upload>;
  friendRequestsById: Record<string, FriendRequest>;
};

function nameOf(p?: Profile | null) {
  return p?.display_name || p?.username || "Someone";
}

export function renderNotification(
  n: Notification,
  ctx: NotificationContext
): { title: string; href: string; subtitle?: ReactNode; metaUsers?: string[]; actions?: "friend_request" } {
  const md = n.metadata ?? {};

  if (n.type === "follow") {
    const followerId = md?.follower_id as string | undefined;
    const p = followerId ? ctx.profilesById[followerId] : null;
    return {
      title: `${nameOf(p)} followed you`,
      href: followerId ? `/profile/${followerId}` : "/profile",
    };
  }

  if (n.type === "friend_request") {
    const fromId = md?.from_user_id as string | undefined;
    const reqId = md?.friend_request_id as string | undefined;
    const from = fromId ? ctx.profilesById[fromId] : null;
    return {
      title: `${nameOf(from)} sent you a friend request`,
      href: fromId ? `/profile/${fromId}` : "/profile",
      actions: reqId ? "friend_request" : undefined,
    };
  }

  if (n.type === "friend_accept") {
    const toId = md?.to_user_id as string | undefined;
    const to = toId ? ctx.profilesById[toId] : null;
    return {
      title: `${nameOf(to)} accepted your friend request`,
      href: toId ? `/profile/${toId}` : "/profile",
    };
  }

  if (n.type === "upload_posted") {
    const uploadId = md?.upload_id as string | undefined;
    const creatorId = md?.creator_id as string | undefined;
    const creator = creatorId ? ctx.profilesById[creatorId] : null;
    const upload = uploadId ? ctx.uploadsById[uploadId] : null;
    return {
      title: `${nameOf(creator)} posted ${upload?.title ? `“${upload.title}”` : "a new upload"}`,
      href: uploadId ? `/uploads/${uploadId}` : "/browse",
    };
  }

  if (n.type === "user_went_live") {
    const hostId = md?.host_user_id as string | undefined;
    const host = hostId ? ctx.profilesById[hostId] : null;
    const u = host?.username;
    return {
      title: `${nameOf(host)} went live`,
      href: u ? `/live/${u}` : hostId ? `/profile/${hostId}` : "/following",
    };
  }

  // Default forum behavior
  if (n.type === "reply") {
    return { title: "New reply", href: n.thread_id ? `/forum/${n.thread_id}` : "/forum" };
  }
  if (n.type === "mention") {
    return { title: "Mentioned you", href: n.thread_id ? `/forum/${n.thread_id}` : "/forum" };
  }
  if (n.type === "keyword") {
    return { title: "Keyword match", href: n.thread_id ? `/forum/${n.thread_id}` : "/forum" };
  }

  return { title: "Notification", href: "/forum" };
}

export function profileLinkFor(id?: string | null, ctx?: NotificationContext) {
  const p = id && ctx ? ctx.profilesById[id] : null;
  if (p?.username) return `/profile/${id}`;
  return id ? `/profile/${id}` : "/profile";
}

export function MiniProfileLink({ id, ctx, children }: { id: string; ctx: NotificationContext; children: ReactNode }) {
  return (
    <Link href={profileLinkFor(id, ctx)} className="hover:underline">
      {children}
    </Link>
  );
}
