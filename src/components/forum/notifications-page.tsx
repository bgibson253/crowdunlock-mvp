"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { renderNotification } from "@/components/social/notification-renderer";

type Notification = {
  id: string;
  thread_id: string | null;
  reply_id: string | null;
  type: string;
  read: boolean;
  created_at: string;
  metadata?: any;
  thread_title?: string;
};

export function NotificationsPage({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [threadTitles, setThreadTitles] = useState<Record<string, string>>({});
  const [profilesById, setProfilesById] = useState<Record<string, any>>({});
  const [uploadsById, setUploadsById] = useState<Record<string, any>>({});
  const [friendRequestsById, setFriendRequestsById] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    setLoading(true);
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from("forum_notifications")
      .select("id, thread_id, reply_id, type, read, created_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    const notifs = (data ?? []) as Notification[];
    setNotifications(notifs);

    const tids = [...new Set(notifs.map((n) => n.thread_id).filter(Boolean))] as string[];

    // Social notification hydration
    const profileIds = new Set<string>();
    const uploadIds = new Set<string>();
    const friendRequestIds = new Set<string>();

    for (const n of notifs) {
      const md = (n as any).metadata ?? {};
      if (n.type === "follow" && md.follower_id) profileIds.add(md.follower_id);
      if (n.type === "friend_request") {
        if (md.from_user_id) profileIds.add(md.from_user_id);
        if (md.friend_request_id) friendRequestIds.add(md.friend_request_id);
      }
      if (n.type === "friend_accept" && md.to_user_id) profileIds.add(md.to_user_id);
      if (n.type === "upload_posted") {
        if (md.creator_id) profileIds.add(md.creator_id);
        if (md.upload_id) uploadIds.add(md.upload_id);
      }
      if (n.type === "user_went_live" && md.host_user_id) profileIds.add(md.host_user_id);
    }

    if (profileIds.size > 0) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .in("id", Array.from(profileIds));
      const map: Record<string, any> = {};
      for (const p of ps ?? []) map[(p as any).id] = p;
      setProfilesById(map);
    }

    if (uploadIds.size > 0) {
      const { data: ups } = await supabase
        .from("uploads")
        .select("id,title,uploader_id")
        .in("id", Array.from(uploadIds));
      const map: Record<string, any> = {};
      for (const u of ups ?? []) map[(u as any).id] = u;
      setUploadsById(map);
    }

    if (friendRequestIds.size > 0) {
      const { data: frs } = await supabase
        .from("friend_requests")
        .select("id,from_user_id,to_user_id,status")
        .in("id", Array.from(friendRequestIds));
      const map: Record<string, any> = {};
      for (const fr of frs ?? []) map[(fr as any).id] = fr;
      setFriendRequestsById(map);
    }
    if (tids.length > 0) {
      const { data: threads } = await supabase
        .from("forum_threads")
        .select("id, title")
        .in("id", tids);
      const map: Record<string, string> = {};
      for (const t of threads ?? []) {
        map[(t as any).id] = (t as any).title;
      }
      setThreadTitles(map);
    }
    setLoading(false);
  }

  async function markAllRead() {
    const supabase = supabaseBrowser();
    await supabase
      .from("forum_notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    const supabase = supabaseBrowser();
    await supabase.from("forum_notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function respondFriendRequest(requestId: string, action: "accept" | "reject") {
    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) return;

      // optimistic update; refresh to reflect derived notifications too
      setFriendRequestsById((prev) => ({
        ...prev,
        [requestId]: { ...(prev as any)[requestId], status: action === "accept" ? "accepted" : "rejected" },
      }));
      fetchAll();
    } catch {
      // ignore
    }
  }

  function typeLabel(type: string) {
    switch (type) {
      case "reply":
        return "New reply";
      case "mention":
        return "Mentioned you";
      case "keyword":
        return "Keyword match";
      case "follow":
        return "Follow";
      case "friend_request":
        return "Friend request";
      case "friend_accept":
        return "Friend accepted";
      case "upload_posted":
        return "New post";
      case "user_went_live":
        return "Live";
      default:
        return "Notification";
    }
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {unread} unread notification{unread !== 1 ? "s" : ""}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {loading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      )}

      {!loading && notifications.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">
              No notifications yet. Subscribe to threads to get notified of new replies.
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition hover:border-primary/25 ${!n.read ? "bg-primary/5 border-primary/15" : ""}`}
            >
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={renderNotification(n as any, {
                      profilesById,
                      liveById: {},
                      uploadsById,
                      friendRequestsById,
                    }).href}
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                    }}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <div className="h-2 w-2 rounded-full bg-primary/50 flex-shrink-0" />
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {typeLabel(n.type)}
                      </Badge>
                    </div>
                    {(() => {
                      const rendered = renderNotification(n as any, {
                        profilesById,
                        liveById: {},
                        uploadsById,
                        friendRequestsById,
                      });

                      if (n.thread_id && threadTitles[n.thread_id]) {
                        return (
                          <div className="text-sm font-medium mt-1 hover:underline">
                            {threadTitles[n.thread_id]}
                          </div>
                        );
                      }

                      return (
                        <div className="text-sm font-medium mt-1 hover:underline">
                          {rendered.title}
                        </div>
                      );
                    })()}
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </div>

                    {(() => {
                      if (n.type !== "friend_request") return null;
                      const reqId = (n as any).metadata?.friend_request_id as string | undefined;
                      if (!reqId) return null;
                      const fr = (friendRequestsById as any)[reqId];
                      if (!fr || fr.status !== "pending") return null;

                      return (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              respondFriendRequest(reqId, "accept");
                              if (!n.read) markRead(n.id);
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              respondFriendRequest(reqId, "reject");
                              if (!n.read) markRead(n.id);
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      );
                    })()}
                  </Link>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markRead(n.id)}
                      className="h-7 w-7"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
