import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { isTestMode } from "@/lib/env";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingSection } from "@/components/uploads/rating-section";
import { TestUnlockButton } from "@/components/uploads/test-unlock-button";
import { ContributeCard } from "@/components/uploads/contribute-card";
import { ReportUploadButton } from "@/components/uploads/report-upload-button";
import { WatchlistButton } from "@/components/uploads/watchlist-button";
import { ShareButtons } from "@/components/ui/share-buttons";
import { UnlockTimingBadge } from "@/components/uploads/unlock-timing-badge";
import { ManualUnlockButton } from "@/components/uploads/manual-unlock-button";
import { UploadUpdatesSection } from "@/components/uploads/upload-updates-section";
import Link from "next/link";

export const dynamic = "force-dynamic";

type UploadRow = {
  id: string;
  title: string;
  status: "private" | "funding" | "unlocked" | "rejected";
  ai_teaser: string | null;
  current_funded: number | null;
  funding_goal: number | null;
  created_at: string;
  uploader_id: string | null;
  funding_deadline: string | null;
  deadline_at: string | null;
  thumbnail_url: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("uploads")
    .select("title,ai_teaser")
    .eq("id", id)
    .maybeSingle();
  const title = data?.title ?? "Upload";
  const description = data?.ai_teaser?.slice(0, 160) ?? "View this upload on Unmaskr.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Unmaskr",
      url: `https://crowdunlock-mvp.vercel.app/uploads/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function UploadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await supabaseServer();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-lg px-4 py-20">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="text-3xl">🔒</div>
              <h2 className="text-lg font-semibold">Log in to see exclusive content</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to view uploads, contribute to funding, and access unlocked content.
              </p>
              <Button asChild>
                <Link href={`/auth?redirect=${encodeURIComponent(`/uploads/${id}`)}`}>Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const { data: upload, error } = await supabase
    .from("uploads")
    .select("id,title,status,ai_teaser,current_funded,funding_goal,created_at,uploader_id,funding_deadline,deadline_at,thumbnail_url")
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

  // Increment view count (fire-and-forget)
  supabase.rpc("increment_upload_views", { p_upload_id: id }).then(() => {});

  const u = upload as UploadRow;
  const testMode = isTestMode();

  // Check watchlist status
  let isWatched = false;
  if (user) {
    const { data: watchRow } = await supabase
      .from("upload_watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("upload_id", id)
      .maybeSingle();
    isWatched = !!watchRow;
  }

  // Fetch updates for this upload
  const { data: updates } = await supabase
    .from("upload_updates")
    .select("id, title, body, created_at, author_id")
    .eq("upload_id", id)
    .order("created_at", { ascending: false });

  // Allow anyone to see funding uploads (not just test mode)
  if (u.status !== "unlocked" && u.status !== "funding") return notFound();

  const isUploader = user?.id === u.uploader_id;
  const isFullyFunded = (u.current_funded ?? 0) >= (u.funding_goal ?? 500);
  const fundingDeadline = u.funding_deadline ?? "none";

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
        <div className="flex items-center gap-2">
          {user && (
            <WatchlistButton
              uploadId={u.id}
              currentUserId={user.id}
              isWatched={isWatched}
              variant="button"
            />
          )}
          {user && u.uploader_id !== user.id && (
            <ReportUploadButton uploadId={u.id} />
          )}
          <Badge variant="secondary">{u.status}</Badge>
        </div>
      </div>

      {/* Funding Deadline Info */}
      <div className="mt-4">
        <UnlockTimingBadge
          fundingDeadline={fundingDeadline}
          deadlineAt={u.deadline_at}
          isFullyFunded={isFullyFunded}
          status={u.status}
        />
      </div>

      {/* Thumbnail preview */}
      {u.thumbnail_url && (
        <div className="mt-4 rounded-xl overflow-hidden border border-border/50">
          <img
            src={u.thumbnail_url}
            alt={u.title}
            className="w-full h-auto max-h-80 object-cover"
            loading="lazy"
          />
        </div>
      )}

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

        {/* Manual unlock for uploader */}
        {isUploader && isFullyFunded && u.status !== "unlocked" && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">🔓 Ready to Unlock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your upload is fully funded! Click below to unlock it for all contributors.
              </p>
              <ManualUnlockButton uploadId={u.id} />
            </CardContent>
          </Card>
        )}

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

        <ContributeCard
          uploadId={u.id}
          currentFunded={u.current_funded ?? 0}
          fundingGoal={u.funding_goal ?? 500}
          unlocked={u.status === "unlocked"}
        />

        <div className="flex items-center gap-2">
          <ShareButtons url={`/uploads/${u.id}`} title={u.title} description={u.ai_teaser?.slice(0, 160)} />
        </div>

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

        {/* Backer Updates Section */}
        <UploadUpdatesSection
          uploadId={u.id}
          uploaderId={u.uploader_id}
          currentUserId={user?.id ?? null}
          updates={updates ?? []}
        />
      </div>
    </main>
  );
}
