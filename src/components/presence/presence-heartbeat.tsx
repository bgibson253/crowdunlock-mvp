"use client";

import { useEffect } from "react";

export function PresenceHeartbeat() {
  useEffect(() => {
    let stopped = false;

    async function ping() {
      try {
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ platform: "web", status: "online" }),
        });
      } catch {
        // ignore
      }
    }

    ping();
    const id = setInterval(() => {
      if (stopped) return;
      ping();
    }, 20000);

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  return null;
}
