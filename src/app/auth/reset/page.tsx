"use client";

import * as React from "react";

import { supabaseBrowser } from "@/lib/supabase/client";
import { envClient } from "@/lib/env";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthResetPage() {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    // Supabase will append tokens in the URL hash for reset links.
    // Calling exchangeCodeForSession() is harmless if none.
    const supabase = supabaseBrowser();
    const env = envClient();

    (async () => {
      try {
        await supabase.auth.exchangeCodeForSession(window.location.href);
      } catch {
        // ignore
      }
      setReady(true);

      // If already signed in, allow password update anyway (Supabase requires a session).
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        // no-op, just keep session updated
      });
      return () => subscription.unsubscribe();
    })();
  }, []);

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }

    setNotice("Password updated. You can continue.");
    window.location.assign("/browse");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="mb-4 rounded-md border bg-muted/40 p-3 text-sm">{notice}</div>
          ) : null}

          <form className="space-y-3" onSubmit={onSetPassword}>
            <div className="space-y-1">
              <div className="text-sm font-medium">New password</div>
              <Input
                type="password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Confirm password</div>
              <Input
                type="password"
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!ready}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!ready}>
              Set password
            </Button>

            <p className="text-xs text-muted-foreground">
              If this page was opened from a reset email, it will activate your reset session automatically.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
