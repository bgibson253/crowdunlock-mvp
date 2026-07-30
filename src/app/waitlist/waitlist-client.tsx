"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

async function submitWaitlist(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false as const, error: "invalid_email" };
  }

  const res = await fetch(`/api/waitlist`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  if (res.status === 409) {
    return { ok: false as const, error: "already_joined" };
  }
  if (!res.ok) {
    return { ok: false as const, error: "server_error" };
  }
  return { ok: true as const };
}

export default function WaitlistClient() {
  const [status, setStatus] = useState<{
    kind: "idle" | "sending" | "ok" | "error";
    error?: string;
  }>({ kind: "idle" });
  const [email, setEmail] = useState("");

  const params = useSearchParams();
  const paramStatus = useMemo(() => params.get("status") || null, [params]);

  const statusText = useMemo(() => {
    if (status.kind === "ok") return "Confirmed. Watch your inbox.";
    if (status.kind === "error")
      return status.error === "already_joined"
        ? "You're already on the list."
        : "Something went wrong. Try again.";
    if (paramStatus === "ok") return "Confirmed. Watch your inbox.";
    if (paramStatus === "already_joined") return "You're already on the list.";
    return null;
  }, [status, paramStatus]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setStatus({ kind: "sending" });
      const fd = new FormData();
      fd.set("email", email);
      const result = await submitWaitlist(fd);
      setStatus(result.ok ? { kind: "ok" } : { kind: "error", error: result.error ?? "server_error" });
    },
    [email]
  );

  const isError =
    status.kind === "error" ||
    (status.kind === "idle" && paramStatus === "already_joined");

  return (
    <form onSubmit={onSubmit} className="mt-10 rounded-2xl border border-primary/15 bg-primary/5 p-5 backdrop-blur">
      <label htmlFor="waitlist-email" className="block text-sm font-medium text-primary">
        Email
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          className="h-12 flex-1 rounded-xl border border-primary/15 bg-black/30 px-4 text-sm text-foreground ring-0 outline-none placeholder:text-muted-foreground/60 focus:border-primary/30"
          autoComplete="email"
          inputMode="email"
          required
          disabled={status.kind === "sending"}
        />
        <Button type="submit" disabled={status.kind === "sending"} className="h-12 px-6 text-sm font-semibold">
          {status.kind === "sending" ? "Joining…" : "Notify me"}
        </Button>
      </div>
      {statusText && (
        <p
          className={`mt-3 text-sm ${isError ? "text-amber-400" : "text-emerald-400"}`}
          role="status"
          aria-live="polite"
        >
          {statusText}
        </p>
      )}
    </form>
  );
}
