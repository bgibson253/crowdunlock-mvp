"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Notification = {
  id: string;
  thread_id: string | null;
  reply_id: string | null;
  type: string;
  read: boolean;
  created_at: string;
};

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [threadTitles, setThreadTitles] = useState<Record<string, string>>({});

  const fetchNotifications = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from("forum_notifications")
      .select("id, thread_id, reply_id, type, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const notifs = (data ?? []) as Notification[];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.read).length);

    const tids = [...new Set(notifs.map((n) => n.thread_id).filter(Boolean))] as string[];
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
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAllRead() {
    const supabase = supabaseBrowser();
    await supabase
      .from("forum_notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    const supabase = supabaseBrowser();
    await supabase
      .from("forum_notifications")
      .update({ read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  function typeLabel(type: string) {
    switch (type) {
      case "reply":
        return "New reply";
      case "mention":
        return "Mentioned you";
      case "keyword":
        return "Keyword match";
      default:
        return "Notification";
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-sm font-bold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No notifications yet.
            </div>
          )}
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.thread_id ? `/forum/${n.thread_id}` : "/forum"}
              onClick={() => {
                if (!n.read) markRead(n.id);
                setOpen(false);
              }}
              className={`block px-4 py-3 border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-start gap-2.5">
                {!n.read && (
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0 shadow-sm shadow-primary/50" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{typeLabel(n.type)}</div>
                  {n.thread_id && threadTitles[n.thread_id] && (
                    <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {threadTitles[n.thread_id]}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="border-t border-border/50 px-4 py-2.5">
          <Link
            href="/forum/notifications"
            className="text-[11px] text-primary hover:underline font-medium"
            onClick={() => setOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
