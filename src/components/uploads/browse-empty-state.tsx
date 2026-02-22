import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function ExampleCard({
  title,
  teaser,
  pct,
}: {
  title: string;
  teaser: string;
  pct: number;
}) {
  return (
    <Card className="overflow-hidden border-indigo-100/80">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400" />
      <CardContent className="space-y-3 py-5">
        <div className="text-sm font-semibold tracking-tight line-clamp-2">
          {title}
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
            title="How to run paid ads profitably (with real dashboards)"
            teaser="A step-by-step playbook: setup, creative testing, landing page iterations, and how to know when to scale."
            pct={34}
          />
          <ExampleCard
            title="Dataset: 10k SaaS landing pages + metadata"
            teaser="Curated collection with conversion hints, pricing models, and positioning angles. Useful for copy + competitive research."
            pct={72}
          />
          <ExampleCard
            title="Template: Creator revenue tracker (Notion + Sheets)"
            teaser="Track unlock goals, contributions, payouts, and which content ideas are trending."
            pct={18}
          />
        </div>
      </CardContent>
    </Card>
  );
}
