import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type SectionRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  threads_count: number;
  replies_count: number;
};

function SectionRowLine({
  id,
  name,
  description,
  threads_count,
  replies_count,
}: SectionRow) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/forum/s/${encodeURIComponent(id)}`}
            className="text-[13px] font-semibold leading-tight hover:underline"
          >
            {name}
          </Link>
          {description && (
            <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">
              {description}
            </div>
          )}
        </div>

        <div className="grid grid-cols-[110px_110px] items-center gap-2 text-[11px] text-muted-foreground">
          <div className="text-right tabular-nums">{threads_count} posts</div>
          <div className="text-right tabular-nums">{replies_count} replies</div>
        </div>
      </div>
    </div>
  );
}

function CollapsibleHeader({
  title,
  variant,
}: {
  title: string;
  variant: "slate" | "indigo" | "emerald";
}) {
  const cls =
    variant === "emerald"
      ? "from-emerald-600 to-emerald-500"
      : variant === "indigo"
        ? "from-indigo-600 to-indigo-500"
        : "from-slate-700 to-slate-600";

  // Note: true "only minimize when clicking the symbol" requires a Client Component.
  // This version uses native <details>/<summary> (click anywhere on the header toggles).
  return (
    <summary
      className={
        "cursor-pointer select-none list-none rounded-md bg-gradient-to-r " +
        cls +
        " px-3 py-2"
      }
    >
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold text-white">{title}</div>
        <div className="text-white/90 text-[12px] font-semibold">
          <span className="group-open:hidden">^</span>
          <span className="hidden group-open:inline">v</span>
        </div>
      </div>
    </summary>
  );
}

export default async function ForumIndexPage() {
  const supabase = await supabaseServer();

  const { data: sectionsRaw, error: sectionsErr } = await supabase
    .from("forum_sections")
    .select("id,name,description,sort_order")
    .order("sort_order", { ascending: true });

  if (sectionsErr) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Could not load sections: {sectionsErr.message}
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = (sectionsRaw ?? []) as Array<
    Omit<SectionRow, "threads_count" | "replies_count">
  >;

  const { data: threadsMini } = await supabase
    .from("forum_threads")
    .select("id,section_id");

  const { data: repliesMini } = await supabase
    .from("forum_replies")
    .select("thread_id");

  const threadIdToSection = new Map<string, string>();
  for (const t of (threadsMini ?? []) as any[]) {
    if (t.id && t.section_id) threadIdToSection.set(t.id, t.section_id);
  }

  const threadsPerSection = new Map<string, number>();
  for (const t of (threadsMini ?? []) as any[]) {
    const sid = t.section_id;
    if (!sid) continue;
    threadsPerSection.set(sid, (threadsPerSection.get(sid) ?? 0) + 1);
  }

  const repliesPerSection = new Map<string, number>();
  for (const r of (repliesMini ?? []) as any[]) {
    const sid = threadIdToSection.get(r.thread_id);
    if (!sid) continue;
    repliesPerSection.set(sid, (repliesPerSection.get(sid) ?? 0) + 1);
  }

  const sectionsWithCounts: SectionRow[] = sections.map((s) => ({
    ...s,
    threads_count: threadsPerSection.get(s.id) ?? 0,
    replies_count: repliesPerSection.get(s.id) ?? 0,
  }));

  const byId = new Map(sectionsWithCounts.map((s) => [s.id, s] as const));

  const general = byId.get("general");
  const introduce = byId.get("introduce_yourself");
  const requested = [
    byId.get("request_story"),
    byId.get("request_data"),
    byId.get("request_video"),
  ].filter(Boolean) as SectionRow[];

  const listed = [
    byId.get("listed_stories"),
    byId.get("listed_data"),
    byId.get("listed_videos"),
  ].filter(Boolean) as SectionRow[];

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Forum</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Public can read. Sign in to start threads and reply.
            </p>
          </div>
          <Button asChild className="h-8 px-3 text-xs">
            <Link href="/forum/new">New thread</Link>
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {general && (
            <details open className="group">
              <CollapsibleHeader title="General Discussion" variant="slate" />
              <div className="mt-1">
                <SectionRowLine {...general} />
              </div>
            </details>
          )}

          {introduce && (
            <details open className="group">
              <CollapsibleHeader title="Uploader Credibility" variant="slate" />
              <div className="mt-1">
                <SectionRowLine {...introduce} />
              </div>
            </details>
          )}

          <details open className="group">
            <CollapsibleHeader title="Requested Items" variant="indigo" />
            <div className="mt-1 space-y-1">
              {requested.map((s) => (
                <SectionRowLine key={s.id} {...s} />
              ))}
            </div>
          </details>

          <details open className="group">
            <CollapsibleHeader title="Listed Items" variant="emerald" />
            <div className="mt-1 space-y-1">
              {listed.map((s) => (
                <SectionRowLine key={s.id} {...s} />
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
