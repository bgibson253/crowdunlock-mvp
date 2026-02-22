"use client";

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Star({ filled }: { filled: boolean }) {
  return (
    <span className={filled ? "text-yellow-500" : "text-muted-foreground"} aria-hidden>
      ★
    </span>
  );
}

type RatingRow = {
  stars: number;
};

export function RatingSection({ uploadId }: { uploadId: string }) {
  const [myStars, setMyStars] = React.useState<number | null>(null);
  const [avg, setAvg] = React.useState<number | null>(null);
  const [count, setCount] = React.useState<number>(0);
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

  async function setStars(stars: number) {
    setError(null);
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in to rate.");
      return;
    }

    const { error } = await supabase.from("ratings").upsert(
      {
        upload_id: uploadId,
        user_id: user.id,
        stars,
      },
      { onConflict: "upload_id,user_id" }
    );

    if (error) {
      setError(error.message);
      return;
    }

    await load();
  }

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

        <div className="text-sm text-muted-foreground">
          {avg === null ? "No ratings yet." : `Average ${avg.toFixed(1)} (${count})`}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm">Your rating:</div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const s = i + 1;
              const filled = (myStars ?? 0) >= s;
              return (
                <Button
                  key={s}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setStars(s)}
                >
                  <Star filled={filled} />
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
