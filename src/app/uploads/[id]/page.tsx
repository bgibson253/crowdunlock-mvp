import { createClient } from "@supabase/supabase-js";
import { envClient, isTestMode } from "@/lib/env";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommentsSection } from "@/components/uploads/comments-section";
import { RatingSection } from "@/components/uploads/rating-section";
import { TestUnlockButton } from "@/components/uploads/test-unlock-button";

export const dynamic = "force-dynamic";

type UploadRow = {
  id: string;
  title: string;
  status: "private" | "funding" | "unlocked" | "rejected";
  ai_teaser: string | null;
  current_funded: number | null;
  funding_goal: number | null;
  created_at: string;
};

export default async function UploadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const env = envClient();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data: upload, error } = await supabase
    .from("uploads")
    .select("id,title,status,ai_teaser,current_funded,funding_goal,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!upload) return notFound();

  const u = upload as UploadRow;
  const testMode = isTestMode();

  // Production behavior: only show unlocked pages.
  // Test mode: allow viewing funding pages (with unlock button).
  if (!testMode && u.status !== "unlocked") return notFound();
  if (testMode && !(u.status === "funding" || u.status === "unlocked")) return notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{u.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {u.status === "unlocked"
              ? "Unlocked community document"
              : "Funding page (test mode)"}
          </p>
        </div>
        <Badge variant="secondary">{u.status}</Badge>
      </div>

      <div className="mt-8 grid gap-4">
        {testMode && u.status !== "unlocked" ? (
          <Card className="border-red-600/40">
            <CardHeader>
              <CardTitle className="text-base">QA Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <TestUnlockButton uploadId={u.id} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teaser</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {u.ai_teaser ?? "(No teaser)"}
          </CardContent>
        </Card>

        {u.status === "unlocked" ? (
          <>
            <RatingSection uploadId={u.id} />
            <CommentsSection uploadId={u.id} />
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Locked</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This upload is not unlocked yet.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
