import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function ExampleCard({
  title,
  teaser,
  pct,
  trending,
}: {
  title: string;
  teaser: string;
  pct: number;
  trending?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-indigo-100/80">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400" />
      <CardContent className="space-y-3 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-semibold tracking-tight line-clamp-2">
            {title}
          </div>
          <div className="flex items-center gap-2">
            {trending && (
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <span aria-hidden>🔥</span>
                Trending
              </div>
            )}
            <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
              Example
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-4">{teaser}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$ {Math.round((pct / 100) * 500)} / $500</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Button className="w-full" disabled>
          View
        </Button>
      </CardContent>
    </Card>
  );
}

export function BrowseEmptyState() {
  return (
    <Card className="rounded-2xl border-dashed">
      <CardContent className="py-10">
        <div className="text-sm font-medium">No uploads yet</div>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          CrowdUnlock is a marketplace for funding gated content. Upload something,
          set a goal, and once it’s funded, it unlocks publicly.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/upload">Create the first upload</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/forum">Request content in the forum</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ExampleCard
            title="Bodycam breakdown: what the official report left out (video)"
            teaser="Independent journalist analysis with timestamped clips, primary sources, and what changed between early statements and final findings."
            pct={61}
            trending
          />
          <ExampleCard
            title="On-the-ground interview: tenant organizing under pressure (video)"
            teaser="Short doc-style piece: interviews, context, and a clean narrative. Includes b-roll and raw transcripts as receipts."
            pct={42}
            trending
          />
          <ExampleCard
            title="FOIA template pack + real requests that worked (story)"
            teaser="Copy/paste templates + commentary, plus examples of wording that got faster responses."
            pct={23}
          />
          <ExampleCard
            title="Investigation: a local contract that quietly doubled in cost (story)"
            teaser="A tight explainer with sourced screenshots, timeline, and the easiest ways to verify each claim."
            pct={78}
          />
          <ExampleCard
            title="Behind the scenes: how I secured sources safely (story)"
            teaser="Practical opsec for journalists: comms hygiene, redaction workflow, and mistakes to avoid."
            pct={36}
          />
          <ExampleCard
            title="Data drop: campaign contributions + network map (dataset)"
            teaser="CSV + a simple graph view showing who’s connected to whom. Includes methodology and limitations."
            pct={15}
          />
        </div>
      </CardContent>
    </Card>
  );
}
