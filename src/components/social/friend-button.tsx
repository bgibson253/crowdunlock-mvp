"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserPlus, UserX } from "lucide-react";

type Status =
  | { kind: "none" }
  | { kind: "incoming"; requestId: string }
  | { kind: "outgoing"; requestId: string }
  | { kind: "friends" };

export function FriendButton({
  targetUserId,
  currentUserId,
}: {
  targetUserId: string;
  currentUserId: string | null;
}) {
  const [status, setStatus] = useState<Status>({ kind: "none" });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!currentUserId || currentUserId === targetUserId) return;
      const supabase = supabaseBrowser();

      // accepted either direction = friends
      const { data: acceptedA } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("from_user_id", currentUserId)
        .eq("to_user_id", targetUserId)
        .eq("status", "accepted")
        .maybeSingle();

      const { data: acceptedB } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("from_user_id", targetUserId)
        .eq("to_user_id", currentUserId)
        .eq("status", "accepted")
        .maybeSingle();

      if (acceptedA || acceptedB) {
        setStatus({ kind: "friends" });
        return;
      }

      const { data: outgoing } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("from_user_id", currentUserId)
        .eq("to_user_id", targetUserId)
        .eq("status", "pending")
        .maybeSingle();

      if (outgoing?.id) {
        setStatus({ kind: "outgoing", requestId: outgoing.id });
        return;
      }

      const { data: incoming } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("from_user_id", targetUserId)
        .eq("to_user_id", currentUserId)
        .eq("status", "pending")
        .maybeSingle();

      if (incoming?.id) {
        setStatus({ kind: "incoming", requestId: incoming.id });
        return;
      }

      setStatus({ kind: "none" });
    })();
  }, [currentUserId, targetUserId]);

  if (!currentUserId || currentUserId === targetUserId) return null;

  async function sendRequest() {
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ toUserId: targetUserId }),
    });
    if (!res.ok) return;
    const json = await res.json().catch(() => ({}));
    const id = json?.request?.id as string | undefined;
    if (id) setStatus({ kind: "outgoing", requestId: id });
    startTransition(() => router.refresh());
  }

  async function respond(requestId: string, action: "accept" | "reject") {
    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    if (!res.ok) return;
    setStatus(action === "accept" ? { kind: "friends" } : { kind: "none" });
    startTransition(() => router.refresh());
  }

  async function cancelOutgoing(requestId: string) {
    const supabase = supabaseBrowser();
    await supabase
      .from("friend_requests")
      .update({ status: "canceled" })
      .eq("id", requestId)
      .eq("from_user_id", currentUserId)
      .eq("status", "pending");
    setStatus({ kind: "none" });
    startTransition(() => router.refresh());
  }

  const disabled = isPending;

  if (status.kind === "friends") {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1">
        <UserCheck className="h-4 w-4" />
        Friends
      </Button>
    );
  }

  if (status.kind === "incoming") {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => respond(status.requestId, "accept")}
          className="gap-1"
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => respond(status.requestId, "reject")}
          className="gap-1"
        >
          <UserX className="h-4 w-4" />
          Reject
        </Button>
      </div>
    );
  }

  if (status.kind === "outgoing") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => cancelOutgoing(status.requestId)}
        className="gap-1"
        title="Cancel friend request"
      >
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
        Requested
      </Button>
    );
  }

  return (
    <Button size="sm" disabled={disabled} onClick={sendRequest} className="gap-1">
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      Add friend
    </Button>
  );
}
