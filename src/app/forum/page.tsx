import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/forum/search-bar";
import { TrendingSidebar } from "@/components/engagement/trending-sidebar";
import { MessageSquare, Users, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Forum",
  description: "Join the Unmaskr community discussion. Browse threads, start conversations, and connect with others.",
};

type SectionRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  threads_count: number;
  replies_count: number;
};

function SectionCard({
  id,
  name,
  description,
  threads_count,
  replies_count,
}: SectionRow) {
  return (
    <Link href={`/forum/s/${encodeURIComponent(id)}`} className="block">
      <div className="card-hover group relative rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary/50" />
              <span className="tabular-nums font-medium">{threads_count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary/50" />
              <span className="tabular-nums font-medium">{replies_count}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CategoryHeader({
  title,
  icon: Icon,
  variant,
}: {
  title: string;
  icon: any;
  variant: "slate" | "indigo" | "emerald";
}) {
  const gradients: Record<string, string> = {
    slate: "from-slate-600/80 to-slate-500/80",
    indigo: "from-primary/80 to-primary/60",
    emerald: "from-emerald-600/80 to-emerald-500/80",
  };

  return (
    <div className={`flex items-center gap-2 rounded-lg bg-gradient-to-r ${gradients[variant]} px-4 py-2.5 backdrop-blur-sm`}>
      <Icon className="h-4 w-4 text-white/80" />
      <span className="text-xs font-bold uppercase tracking-wider text-white">{title}</span>
    </div>
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
  const recommendations = byId.get("recommendations");
  const requested = [
    byId.get("request_story"),
    byId.get("request_data"),
    byId.get("request_video"),
    byId.get("request_document"),
    byId.get("request_image"),
    byId.get("request_other"),
  ].filter(Boolean) as SectionRow[];

  const listed = [
    byId.get("listed_stories"),
    byId.get("listed_data"),
    byId.get("listed_videos"),
    byId.get("listed_documents"),
    byId.get("listed_images"),
    byId.get("listed_other"),
  ].filter(Boolean) as SectionRow[];

  return (
    <div className="relative isolate min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Forum</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Public can read. Sign in to start threads and reply.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SearchBar />
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm font-medium">
              <Link href="/forum/new">New thread</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-[1fr_280px] gap-8">
          {/* Main sections column */}
          <div className="space-y-6">
          {(general || introduce || recommendations) && (
            <div className="space-y-2">
              <CategoryHeader title="General Discussion" icon={MessageSquare} variant="slate" />
              <div className="space-y-1.5">
                {general && <SectionCard {...general} />}
                {introduce && <SectionCard {...introduce} />}
                {recommendations && <SectionCard {...recommendations} />}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <CategoryHeader title="Requested Items" icon={Zap} variant="indigo" />
            <div className="space-y-1.5">
              {requested.map((s) => (
                <SectionCard key={s.id} {...s} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <CategoryHeader title="Listed Items" icon={Users} variant="emerald" />
            <div className="space-y-1.5">
              {listed.map((s) => (
                <SectionCard key={s.id} {...s} />
              ))}
            </div>
          </div>
          </div>

          {/* Sidebar */}
          <div className="hidden md:block space-y-4">
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
