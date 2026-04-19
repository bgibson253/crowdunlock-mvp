"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LiveHostPanel({ username }: { username: string }) {
  const [title, setTitle] = useState("");
  const [active, setActive] = useState<{ id: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // best-effort: if host opens /live while already live, we can detect later.
  }, []);

  async function goLive() {
    // Force browser permission prompt up-front
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      // Stop immediately; LiveKitRoom will request again when it connects.
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      toast.error("Camera/microphone permission is required to go live");
      return;
    }

    const res = await fetch("/api/live/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: title.trim() || null }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json?.error ?? "Failed to start live");
      return;
    }
    setActive({ id: json.room?.id });
    toast.success("You are live");

    // Auto-open the live page (viewer UI) immediately
    window.location.href = `/live/${encodeURIComponent(username)}`;
  }

  async function endLive() {
    const res = await fetch("/api/live/end", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json?.error ?? "Failed to end live");
      return;
    }
    setActive(null);
    toast.success("Live ended");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Go live</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          You’ll go live immediately. Your watch URL will be: {" "}
          <Link className="underline" href={`/live/${username}`}>{`/live/${username}`}</Link>
        </div>

        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {active ? (
            <>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => startTransition(endLive)}
              >
                End live
              </Button>
              <Button asChild variant="outline" disabled={pending}>
                <Link href={`/live/${username}`}>Open stream</Link>
              </Button>
            </>
          ) : (
            <Button disabled={pending} onClick={() => startTransition(goLive)}>
              Go live
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Note: currently uses your browser camera/mic. Add permissions when prompted.
        </div>
      </CardContent>
    </Card>
  );
}
