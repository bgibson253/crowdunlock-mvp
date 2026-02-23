"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Upload = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

export function UnlockAnyUploadPanel({ uploads }: { uploads: Upload[] }) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function unlock(uploadId: string) {
    setMsg(null);
    setBusyId(uploadId);
    try {
      const res = await fetch("/api/test/unlock-upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });

      if (!res.ok) {
        const txt = await res.text();
        setMsg(txt || "Failed");
        return;
      }

      setMsg("Unlocked. Refreshing…");
      window.location.reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-foreground">Unlock Any Upload</div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>

      {msg ? <div className="rounded-md border p-2 text-xs">{msg}</div> : null}

      <div className="space-y-2">
        {uploads.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{u.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{u.id}</div>
            </div>
            <div className="flex flex-none items-center gap-2">
              <Badge variant="secondary">{u.status}</Badge>
              <Button
                size="sm"
                disabled={busyId === u.id || u.status === "unlocked"}
                onClick={() => unlock(u.id)}
              >
                {u.status === "unlocked" ? "Unlocked" : busyId === u.id ? "Unlocking…" : "Unlock"}
              </Button>
            </div>
          </div>
        ))}

        {uploads.length === 0 ? (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">No uploads yet.</div>
        ) : null}
      </div>
    </div>
  );
}
