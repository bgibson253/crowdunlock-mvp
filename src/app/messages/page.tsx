import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessagesClient } from "@/components/forum/messages-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=%2Fmessages");

  // Get all DMs for this user
  const { data: dms } = await supabase
    .from("forum_dms")
    .select("id, sender_id, recipient_id, body, read, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // Build conversation list (group by other user)
  const conversations = new Map<string, {
    otherId: string;
    lastMessage: string;
    lastAt: string;
    unread: number;
  }>();

  for (const dm of (dms ?? []) as any[]) {
    const otherId = dm.sender_id === user.id ? dm.recipient_id : dm.sender_id;
    if (!conversations.has(otherId)) {
      conversations.set(otherId, {
        otherId,
        lastMessage: dm.body,
        lastAt: dm.created_at,
        unread: 0,
      });
    }
    if (!dm.read && dm.recipient_id === user.id) {
      const conv = conversations.get(otherId)!;
      conv.unread++;
    }
  }

  const otherIds = Array.from(conversations.keys());
  const { data: profiles } = otherIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", otherIds)
    : { data: [] as any[] };

  const profileMap = new Map<string, any>();
  for (const p of (profiles ?? []) as any[]) {
    profileMap.set(p.id, p);
  }

  const convList = Array.from(conversations.values()).map((c) => {
    const p = profileMap.get(c.otherId);
    return {
      ...c,
      name: p?.display_name ?? p?.username ?? "User",
      avatar_url: p?.avatar_url ?? null,
    };
  });

  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Messages</h1>

        {convList.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-12 text-center space-y-3">
            <div className="text-4xl">💬</div>
            <p className="text-sm font-semibold">No conversations yet</p>
            <p className="text-xs text-muted-foreground">
              Visit someone&apos;s profile to send them a message.
            </p>
            <Link href="/forum" className="inline-block">
              <span className="text-xs text-primary hover:underline">Browse the forum →</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {convList.map((c) => (
              <Link key={c.otherId} href={`/messages/${c.otherId}`}>
                <div className="card-hover rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm py-3 px-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                      {c.avatar_url ? <AvatarImage src={c.avatar_url} alt={c.name} /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.lastAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
