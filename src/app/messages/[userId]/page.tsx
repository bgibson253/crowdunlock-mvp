import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DmThread } from "@/components/forum/dm-thread";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: otherId } = await params;
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?redirect=${encodeURIComponent(`/messages/${otherId}`)}`);

  // Get the other user's profile
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .eq("id", otherId)
    .maybeSingle();

  if (!otherProfile) return notFound();

  const otherName = otherProfile.display_name ?? otherProfile.username ?? "User";

  // Get messages between the two users
  const { data: messages } = await supabase
    .from("forum_dms")
    .select("id, sender_id, recipient_id, body, encrypted_body, nonce, encrypted, read, created_at")
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  // Mark unread messages as read
  const unreadIds = ((messages ?? []) as any[])
    .filter((m) => m.recipient_id === user.id && !m.read)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await supabase
      .from("forum_dms")
      .update({ read: true })
      .in("id", unreadIds);
  }

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/messages" className="text-sm text-muted-foreground hover:underline">
            ← Messages
          </Link>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {otherProfile.avatar_url ? <AvatarImage src={otherProfile.avatar_url} alt={otherName} /> : null}
              <AvatarFallback>{otherName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Link href={`/profile/${otherId}`} className="text-sm font-medium hover:underline">
              {otherName}
            </Link>
          </div>
        </div>

        <DmThread
          messages={(messages ?? []) as any[]}
          currentUserId={user.id}
          recipientId={otherId}
          recipientName={otherName}
        />
      </div>
    </div>
  );
}
