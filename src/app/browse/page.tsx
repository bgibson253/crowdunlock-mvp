import { createClient } from "@supabase/supabase-js";
import { envClient, isTestMode } from "@/lib/env";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BrowseEmptyState } from "@/components/uploads/browse-empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

type UploadPublic = {
  id: string;
  title: string;
  ai_teaser: string | null;
  status: string;
  funding_goal: number | null;
  current_funded: number | null;
  created_at: string;
  uploader_id: string | null;
  uploader_username: string | null;
  uploader_avatar_url: string | null;
};

export default async function BrowsePage() {
  const env = envClient();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const testMode = isTestMode();

  // Auth check
  const supabaseAuth = await supabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return (
      <main className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
        <div className="mx-auto max-w-lg px-4 py-20">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="text-3xl">🔒</div>
              <h2 className="text-lg font-semibold">Log in to see exclusive content</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to browse uploads, contribute to funding, and access unlocked content.
              </p>
              <Button asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("uploads_public")
    .select(
      "id,title,ai_teaser,status,funding_goal,current_funded,created_at,uploader_id,uploader_username,uploader_avatar_url",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-md border p-4 text-sm text-destructive">{error.message}</div>
      </main>
    );
  }

  const uploads = (data ?? []) as UploadPublic[];

  return (
    <main className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Browse</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Teasers only. Unlocks go public when funded.
              {testMode ? " (Test mode: use Test Unlock buttons.)" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {testMode ? (
              <Button asChild variant="destructive">
                <Link href="/test-admin">Test Admin</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/upload">Upload</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8">
          {uploads.length === 0 ? (
            <BrowseEmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((u) => {
                const goal = u.funding_goal ?? 500;
                const current = u.current_funded ?? 0;
                const pct = Math.min(100, Math.round((current / goal) * 100));

                return (
                  <Card
                    key={u.id}
                    className="overflow-hidden transition hover:border-indigo-200 hover:bg-indigo-50/20"
                  >
                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400" />
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-base">{u.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="line-clamp-4 text-sm text-muted-foreground">
                        {u.ai_teaser ?? "(Teaser pending)"}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            ${Math.floor(current / 100)} / ${Math.floor(goal / 100)}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <Progress value={pct} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-6 w-6">
                            {u.uploader_avatar_url ? (
                              <AvatarImage src={u.uploader_avatar_url} alt={u.uploader_username ?? "User"} />
                            ) : null}
                            <AvatarFallback>
                              {(u.uploader_username ?? "U").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="line-clamp-1">{u.uploader_username ?? "Anonymous"}</span>
                        </div>
                        <Button asChild size="sm" className="shrink-0" disabled={false}>
                          <Link href={`/uploads/${u.id}`}>{testMode ? "View / Test" : "View"}</Link>
                        </Button>
                      </div>
                      {!testMode && u.status !== "funding" ? (
                        <div className="text-xs text-muted-foreground">
                          Locked (unlocked listings will appear and open automatically)
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
