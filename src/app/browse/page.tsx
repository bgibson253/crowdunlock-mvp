import { createClient } from "@supabase/supabase-js";
import { envClient } from "@/lib/env";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type UploadPublic = {
  id: string;
  title: string;
  ai_teaser: string | null;
  status: string;
  funding_goal: number | null;
  current_funded: number | null;
  created_at: string;
};

export default async function BrowsePage() {
  const env = envClient();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from("uploads_public")
    .select("id,title,ai_teaser,status,funding_goal,current_funded,created_at")
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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Browse</h1>
          <p className="mt-2 text-sm text-muted-foreground">Teasers only. Unlocks go public when funded.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/upload">Upload</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {uploads.map((u) => {
          const goal = u.funding_goal ?? 500;
          const current = u.current_funded ?? 0;
          const pct = Math.min(100, Math.round((current / goal) * 100));

          return (
            <Card key={u.id} className="overflow-hidden">
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
                      ${current} / ${goal}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
                <div className="flex gap-2">
                  <Button asChild className="w-full" disabled={u.status !== "funding"}>
                    <Link href={`/contribute/${u.id}`}>Contribute</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
