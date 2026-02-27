"use client";

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Star({ filled, size = "sm" }: { filled: boolean; size?: "sm" | "lg" }) {
  return (
    <span
      className={
        (filled ? "text-yellow-500" : "text-muted-foreground/40") +
        (size === "lg" ? " text-xl" : "")
      }
      aria-hidden
    >
      ★
    </span>
  );
}

function StarRow({ stars, max = 5, size = "sm" }: { stars: number; max?: number; size?: "sm" | "lg" }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} filled={i < stars} size={size} />
      ))}
    </span>
  );
}

type RatingRow = { stars: number };

export function RatingSection({ uploadId }: { uploadId: string }) {
  const [myStars, setMyStars] = React.useState<number | null>(null);
  const [avg, setAvg] = React.useState<number | null>(null);
  const [count, setCount] = React.useState<number>(0);
  const [hoverStar, setHoverStar] = React.useState<number | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setError(null);
    const supabase = supabaseBrowser();

    const { data: all, error: e1 } = await supabase
      .from("ratings")
      .select("stars")
      .eq("upload_id", uploadId);

    if (e1) {
      setError(e1.message);
      return;
    }

    const rows = (all ?? []) as RatingRow[];
    const c = rows.length;
    const a = c ? rows.reduce((s, r) => s + r.stars, 0) / c : null;
    setCount(c);
    setAvg(a);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: mine } = await supabase
        .from("ratings")
        .select("stars")
        .eq("upload_id", uploadId)
        .eq("user_id", user.id)
        .maybeSingle();
      setMyStars((mine as RatingRow | null)?.stars ?? null);
    } else {
      setMyStars(null);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId]);

  async function submitRating(stars: number) {
    setError(null);
    setSubmitting(true);
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in to rate.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("ratings").upsert(
      {
        upload_id: uploadId,
        user_id: user.id,
        stars,
      },
      { onConflict: "upload_id,user_id" },
    );

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    await load();
    setSubmitting(false);
  }

  const hasRated = myStars !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* Aggregate rating display */}
        <div className="flex items-center gap-3">
          {avg !== null ? (
            <>
              <span className="text-3xl font-semibold tabular-nums">{avg.toFixed(1)}</span>
              <div>
                <StarRow stars={Math.round(avg)} size="lg" />
                <div className="text-xs text-muted-foreground mt-0.5">
                  {count} {count === 1 ? "rating" : "ratings"}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No ratings yet. Be the first!</div>
          )}
        </div>

        {/* User's own rating — picker or locked result */}
        {hasRated ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Your rating:</span>
            <StarRow stars={myStars} />
            <span className="text-xs text-muted-foreground ml-1">({myStars}/5)</span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-sm font-medium">Rate this upload</div>
            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHoverStar(null)}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const s = i + 1;
                const filled = s <= (hoverStar ?? 0);
                return (
                  <Button
                    key={s}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    disabled={submitting}
                    onMouseEnter={() => setHoverStar(s)}
                    onClick={() => submitRating(s)}
                  >
                    <Star filled={filled} size="lg" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
