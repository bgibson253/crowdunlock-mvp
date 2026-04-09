import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Eye } from "lucide-react";
import { WatchlistButton } from "@/components/uploads/watchlist-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Watchlist",
  description: "Your saved uploads on Unmaskr.",
};

export default async function WatchlistPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/watchlist");

  // Get watchlist items with upload details
  const { data: watchlistItems } = await supabase
    .from("upload_watchlist")
    .select("upload_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const uploadIds = (watchlistItems ?? []).map((w: any) => w.upload_id);

  let uploads: any[] = [];
  if (uploadIds.length > 0) {
    const { data } = await supabase
      .from("uploads")
      .select("id, title, ai_teaser, status, current_funded, funding_goal, created_at, uploader_id")
      .in("id", uploadIds);
    uploads = data ?? [];
  }

  // Get uploader profiles
  const uploaderIds = Array.from(new Set(uploads.map((u: any) => u.uploader_id).filter(Boolean)));
  let profileMap: Record<string, any> = {};
  if (uploaderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", uploaderIds);
    for (const p of (profiles ?? []) as any[]) {
      profileMap[p.id] = p;
    }
  }

  // Sort uploads by watchlist order (most recently added first)
  const uploadMap = new Map(uploads.map((u: any) => [u.id, u]));
  const sortedUploads = uploadIds
    .map((id: string) => uploadMap.get(id))
    .filter(Boolean);

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary fill-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <span className="text-sm text-muted-foreground">({sortedUploads.length})</span>
        </div>

        {sortedUploads.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">No saved uploads yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Bookmark uploads you want to track. You&apos;ll see their funding progress here.
            </p>
            <Button asChild>
              <Link href="/browse">Browse uploads</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedUploads.map((u: any) => {
              const goal = u.funding_goal ?? 500;
              const current = u.current_funded ?? 0;
              const pct = Math.min(100, Math.round((current / goal) * 100));
              const isNearGoal = pct >= 80 && u.status === "funding";
              const isFunded = u.status === "unlocked";
              const prof = profileMap[u.uploader_id];

              return (
                <Card
                  key={u.id}
                  className={`overflow-hidden ${
                    isNearGoal
                      ? "border-amber-400/50 ring-1 ring-amber-400/20"
                      : isFunded
                      ? "border-green-400/50 ring-1 ring-green-400/20"
                      : ""
                  }`}
                >
                  <div
                    className={`h-1 w-full ${
                      isFunded
                        ? "bg-gradient-to-r from-green-400 to-emerald-500"
                        : isNearGoal
                        ? "bg-gradient-to-r from-amber-400 to-orange-500"
                        : "bg-gradient-to-r from-primary via-primary/60 to-primary/30"
                    }`}
                  />
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/uploads/${u.id}`} className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold line-clamp-2 hover:text-primary transition-colors">
                          {u.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1 shrink-0">
                        {isFunded && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
                            ✅ Funded
                          </Badge>
                        )}
                        {isNearGoal && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                            🔥 Almost there
                          </Badge>
                        )}
                        <WatchlistButton
                          uploadId={u.id}
                          currentUserId={user.id}
                          isWatched={true}
                        />
                      </div>
                    </div>

                    {u.ai_teaser && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {u.ai_teaser}
                      </p>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          ${Math.floor(current / 100)} / ${Math.floor(goal / 100)}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} />
                    </div>

                    {prof && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>by</span>
                        <Link href={`/profile/${u.uploader_id}`} className="hover:text-primary">
                          {prof.username ?? "User"}
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
