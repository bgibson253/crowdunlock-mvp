import { Suspense } from "react";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { fetchCategories, fetchBrowseUploads, searchUploads, type BrowseSort } from "@/lib/supabase/browse";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrowseEmptyState } from "@/components/uploads/browse-empty-state";
import { CategoryFilter } from "@/components/uploads/category-filter";
import { SortDropdown } from "@/components/uploads/sort-dropdown";
import { TagSearch } from "@/components/uploads/tag-search";
import { UploadSearch } from "@/components/uploads/upload-search";
import { WatchlistButton } from "@/components/uploads/watchlist-button";
import { isTestMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse",
  description: "Browse and fund exclusive content on Unmaskr.",
};

const PAGE_SIZE = 12;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    tag?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const testMode = isTestMode();
  const sp = await searchParams;

  // Auth check
  const supabaseAuth = await supabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return (
      <main className="relative isolate min-h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto max-w-lg px-4">
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-12 text-center space-y-4 shadow-2xl shadow-primary/5">
            <div className="text-4xl">🔒</div>
            <h2 className="text-xl font-bold">Log in to see exclusive content</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to browse uploads, contribute to funding, and access unlocked content.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/auth?redirect=%2Fbrowse">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const categorySlug = sp.category || null;
  const sort = (sp.sort as BrowseSort) || "newest";
  const tag = sp.tag || null;
  const query = sp.q || null;
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const [categories, result] = await Promise.all([
    fetchCategories(),
    query
      ? searchUploads({
          query,
          categorySlug,
          sort: sort === "newest" ? "relevance" : sort,
          limit: PAGE_SIZE,
          offset,
          callerId: user.id,
        })
      : fetchBrowseUploads({
          categorySlug,
          tag,
          sort,
          limit: PAGE_SIZE,
          offset,
          callerId: user.id,
        }),
  ]);

  const { uploads, totalCount } = result;

  // Fetch user's watchlist for these uploads
  const uploadIds = uploads.map((u) => u.id);
  let watchedSet = new Set<string>();
  if (uploadIds.length > 0) {
    const { data: watched } = await supabaseAuth
      .from("upload_watchlist")
      .select("upload_id")
      .eq("user_id", user.id)
      .in("upload_id", uploadIds);
    watchedSet = new Set((watched ?? []).map((w: any) => w.upload_id));
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function buildPageHref(p: number) {
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (sort !== "newest") params.set("sort", sort);
    if (tag) params.set("tag", tag);
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/browse?${qs}` : "/browse";
  }

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Teasers only. Unlocks go public when funded.
              {testMode ? " (Test mode: use Test Unlock buttons.)" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {testMode && (
              <Button asChild variant="destructive">
                <Link href="/test-admin">Test Admin</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="border-border/50">
              <Link href="/upload">Upload</Link>
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-6">
          <Suspense>
            <UploadSearch />
          </Suspense>
        </div>

        {/* Filters bar */}
        <div className="mt-4 space-y-3">
          <Suspense>
            <CategoryFilter categories={categories} activeSlug={categorySlug} />
          </Suspense>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Suspense>
              <SortDropdown activeSort={sort} />
            </Suspense>
            <div className="flex items-center gap-3">
              <Suspense>
                <TagSearch />
              </Suspense>
              {totalCount > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalCount} item{totalCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6">
          {uploads.length === 0 ? (
            totalCount === 0 && !categorySlug && !tag ? (
              <BrowseEmptyState />
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/50 p-10 text-center backdrop-blur-sm">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-sm font-medium">No uploads match your filters</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a different category or tag.</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/browse">Clear filters</Link>
                </Button>
              </div>
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((u) => {
                const goal = u.funding_goal ?? 500;
                const current = u.current_funded ?? 0;
                const pct = Math.min(100, Math.round((current / goal) * 100));

                return (
                  <div
                    key={u.id}
                    className="card-hover overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
                  >
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-base font-semibold">{u.title}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          {u.category_icon && (
                            <span className="text-lg" title={u.category_name ?? undefined}>
                              {u.category_icon}
                            </span>
                          )}
                          <WatchlistButton
                            uploadId={u.id}
                            currentUserId={user.id}
                            isWatched={watchedSet.has(u.id)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-5 space-y-3">
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
                      {u.view_count > 0 && (
                        <div className="text-xs text-muted-foreground">
                          👁 {u.view_count} views
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-6 w-6">
                            {u.uploader_avatar_url ? (
                              <AvatarImage
                                src={u.uploader_avatar_url}
                                alt={u.uploader_username ?? "User"}
                              />
                            ) : null}
                            <AvatarFallback>
                              {(u.uploader_username ?? "U").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="line-clamp-1">
                            {u.uploader_username ?? "Anonymous"}
                          </span>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          className="shrink-0 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                          <Link href={`/uploads/${u.id}`}>
                            {testMode ? "View / Test" : "View"}
                          </Link>
                        </Button>
                      </div>
                      {!testMode && u.status !== "funding" ? (
                        <div className="text-xs text-muted-foreground">
                          Locked (unlocked listings will appear and open automatically)
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildPageHref(page - 1)}>← Previous</Link>
              </Button>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildPageHref(page + 1)}>Next →</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
