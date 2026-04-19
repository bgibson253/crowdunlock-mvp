"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

type Row = {
  tier: "following" | "mutual";
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_live: boolean;
  live_room_id: string | null;
  live_room_title: string | null;
};

export function FollowingList() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const res = await fetch("/api/presence/following");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      if (canceled) return;
      setRows(json.rows ?? []);
    })();

    const id = setInterval(() => {
      fetch("/api/presence/following")
        .then((r) => r.json())
        .then((j) => setRows(j.rows ?? []))
        .catch(() => {});
    }, 15000);

    return () => {
      canceled = true;
      clearInterval(id);
    };
  }, []);

  const following = rows.filter((r) => r.tier === "following");
  const mutuals = rows.filter((r) => r.tier === "mutual");

  function PersonRow({ r }: { r: Row }) {
    const name = r.display_name || r.username || "Unknown";
    const href = r.username ? `/profile/${r.user_id}` : `/profile/${r.user_id}`;
    const liveHref = r.username ? `/live/${r.username}` : null;

    return (
      <div className="flex items-center justify-between gap-3 py-2">
        <Link href={href} className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7">
            {r.avatar_url ? <AvatarImage src={r.avatar_url} alt={name} /> : null}
            <AvatarFallback className="text-[10px]">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {r.is_live ? (r.live_room_title || "LIVE") : "Offline/away"}
            </div>
          </div>
        </Link>
        {r.is_live && liveHref && (
          <Link
            href={liveHref}
            className="shrink-0 rounded-md bg-red-500/15 text-red-300 border border-red-500/30 px-2 py-1 text-xs font-semibold"
          >
            LIVE
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Following
        </div>
        <div className="divide-y divide-border/50">
          {following.length ? following.map((r) => <PersonRow key={r.user_id} r={r} />) : (
            <div className="text-sm text-muted-foreground">You aren’t following anyone yet.</div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Mutuals
        </div>
        <div className="divide-y divide-border/50">
          {mutuals.length ? mutuals.map((r) => <PersonRow key={r.user_id} r={r} />) : (
            <div className="text-sm text-muted-foreground">No mutual friends yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
