import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { isTestMode } from "@/lib/env";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingSection } from "@/components/uploads/rating-section";
import { TestUnlockButton } from "@/components/uploads/test-unlock-button";
import { ContributeCard } from "@/components/uploads/contribute-card";

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

export default async function UploadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await supabaseServer();

  const { data: upload, error } = await supabase
    .from("uploads")
    .select("id,title,status,ai_teaser,current_funded,funding_goal,created_at")
    .eq("id", id)
    .maybeSingle();

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("id")
    .eq("upload_id", id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!upload) return notFound();

  const u = upload as UploadRow;
  const testMode = isTestMode();

  // Allow anyone to see funding uploads (not just test mode)
  if (u.status !== "unlocked" && u.status !== "funding") return notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{u.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {u.status === "unlocked"
              ? "Unlocked community document"
              : "Help fund this upload to unlock it for everyone"}
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
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Teaser</CardTitle>
              {u.status === "unlocked" && (
                <a
                  className="text-sm underline"
                  href={"/api/uploads/" + u.id + "/download"}
                >
                  Download
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {u.ai_teaser ?? "(No teaser)"}
          </CardContent>
        </Card>

        {u.status === "funding" && (
          <ContributeCard
            uploadId={u.id}
            currentFunded={u.current_funded ?? 0}
            fundingGoal={u.funding_goal ?? 500}
          />
        )}

        {u.status === "unlocked" ? (
          <>
            <RatingSection uploadId={u.id} />

            {thread?.id ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Discussion</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <a className="underline" href={"/forum/" + thread.id}>
                    View / join the forum discussion
                  </a>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
