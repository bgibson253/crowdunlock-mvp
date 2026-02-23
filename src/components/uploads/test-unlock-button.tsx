"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function TestUnlockButton({ uploadId }: { uploadId: string }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function unlock() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/test/unlock-upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setErr(txt || "Failed");
        return;
      }

      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {err ? <div className="rounded-md border p-2 text-xs text-destructive">{err}</div> : null}
      <Button onClick={unlock} disabled={busy} className="w-full">
        {busy ? "Unlocking…" : "Test Unlock This Now"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Test mode only. Instantly flips status to <span className="font-mono">unlocked</span>.
      </p>
    </div>
  );
}
