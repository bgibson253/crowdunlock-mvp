import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/forum/search-bar";
import { NotificationBell } from "@/components/forum/notification-bell";
import { EngagedRail } from "@/components/forum/engaged-rail";
import { PopularRail } from "@/components/forum/popular-rail";
import { TrendingSidebar } from "@/components/engagement/trending-sidebar";
import {
  MessageSquare,
  Users,
  Zap,
  Newspaper,
  Database,
  Video,
  FileText,
  Image as ImageIcon,
  Package,
  Hand,
  Sparkles,
  ChevronRight,
} from "lucide-react";

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

/* Per-section identity: icon + accent so sections read at a glance. */
const SECTION_META: Record<string, { icon: any; accent: string; iconBg: string }> = {
  general: { icon: MessageSquare, accent: "group-hover:border-slate-400/40", iconBg: "bg-slate-500/10 text-slate-300" },
  introduce_yourself: { icon: Hand, accent: "group-hover:border-sky-400/40", iconBg: "bg-sky-500/10 text-sky-300" },
  recommendations: { icon: Sparkles, accent: "group-hover:border-fuchsia-400/40", iconBg: "bg-fuchsia-500/10 text-fuchsia-300" },
  request_story: { icon: Newspaper, accent: "group-hover:border-primary/50", iconBg: "bg-primary/10 text-primary" },
  request_data: { icon: Database, accent: "group-hover:border-cyan-400/40", iconBg: "bg-cyan-500/10 text-cyan-300" },
  request_video: { icon: Video, accent: "group-hover:border-rose-400/40", iconBg: "bg-rose-500/10 text-rose-300" },
  request_document: { icon: FileText, accent: "group-hover:border-amber-400/40", iconBg: "bg-amber-500/10 text-amber-300" },
  request_image: { icon: ImageIcon, accent: "group-hover:border-violet-400/40", iconBg: "bg-violet-500/10 text-violet-300" },
  request_other: { icon: Package, accent: "group-hover:border-zinc-400/40", iconBg: "bg-zinc-500/10 text-zinc-300" },
  listed_stories: { icon: Newspaper, accent: "group-hover:border-emerald-400/40", iconBg: "bg-emerald-500/10 text-emerald-300" },
  listed_data: { icon: Database, accent: "group-hover:border-emerald-400/40", iconBg: "bg-emerald-500/10 text-emerald-300" },
  listed_videos: { icon: Video, accent: "group-hover:border-emerald-400/40", iconBg: "bg-emerald-500/10 text-emerald-300" },
  listed_documents: { icon: FileText, accent: "group-hover:border-emerald-400/40", iconBg: "bg-emerald-500/10 text-emerald-300" },
  listed_images: { icon: ImageIcon, accent: "group-hover:border-emerald-400/40", iconBg: "bg-emerald-500/10 text-emerald-300" },
  listed_other: { icon: Package, accent: "group-hover:border-emerald-400/40", iconBg: "bg-emerald-500/10 text-emerald-300" },
};

function SectionCard({
  id,
  name,
  description,
  threads_count,
  replies_count,
}: SectionRow) {
  const meta = SECTION_META[id] ?? SECTION_META.general;
  const Icon = meta.icon;
  const isEmpty = threads_count === 0;

  return (
    <Link href={`/forum/s/${encodeURIComponent(id)}`} className="block">
      <div className={`card-hover group relative flex items-center gap-3.5 rounded-xl border border-border/50 bg-card/50 p-3.5 backdrop-blur-sm transition-colors ${meta.accent}`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {name}
          </h3>
          {description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          {isEmpty ? (
            <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
              Be first
            </span>
          ) : (
            <>
              <div className="flex items-center gap-1" title={`${threads_count} threads`}>
                <MessageSquare className="h-3.5 w-3.5 opacity-50" />
                <span className="tabular-nums font-medium">{threads_count}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1" title={`${replies_count} replies`}>
                <Users className="h-3.5 w-3.5 opacity-50" />
                <span className="tabular-nums font-medium">{replies_count}</span>
              </div>
            </>
          )}
          <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" />
        </div>
      </div>
    </Link>
  );
}

function CategoryHeader({
  title,
  subtitle,
  icon: Icon,
  variant,
}: {
  title: string;
  subtitle?: string;
  icon: any;
  variant: "slate" | "indigo" | "emerald";
}) {
  const styles: Record<string, { text: string; line: string }> = {
    slate: { text: "text-slate-300", line: "from-slate-500/50" },
    indigo: { text: "text-primary", line: "from-primary/50" },
    emerald: { text: "text-emerald-400", line: "from-emerald-500/50" },
  };
  const s = styles[variant];

  return (
    <div className="flex items-baseline gap-3 pt-1">
      <div className={`flex items-center gap-2 ${s.text}`}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
      <div className={`h-px flex-1 self-center bg-gradient-to-r ${s.line} to-transparent`} />
    </div>
  );
}

export default async function ForumIndexPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // One aggregate RPC instead of full-table scans of threads + replies.
  const { data: statsRows } = await supabase.rpc("forum_section_stats");

  const threadsPerSection = new Map<string, number>();
  const repliesPerSection = new Map<string, number>();
  for (const row of (statsRows ?? []) as any[]) {
    if (!row?.section_id) continue;
    threadsPerSection.set(row.section_id, Number(row.threads_count ?? 0));
    repliesPerSection.set(row.section_id, Number(row.replies_count ?? 0));
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

      <div className="mx-auto max-w-7xl px-4 py-10">
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
            {user && <NotificationBell userId={user.id} />}
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm font-medium">
              <Link href="/forum/new">New thread</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr_280px] md:grid-cols-[1fr_280px]">
          {/* Left rail: your activity (desktop only) */}
          <div className="hidden lg:block space-y-4">
            {user ? (
              <EngagedRail userId={user.id} />
            ) : (
              <div className="rounded-xl border border-border/30 bg-card/50 p-4 backdrop-blur-sm">
                <h3 className="text-xs font-bold">Join the discussion</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Sign in to track threads you post in, favorite, or pledge to fund.
                </p>
                <Link href="/auth?redirect=%2Fforum" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
                  Sign in →
                </Link>
              </div>
            )}
          </div>

          {/* Main sections column */}
          <div className="space-y-6">
          {(general || introduce || recommendations) && (
            <div className="space-y-2">
              <CategoryHeader title="Community" subtitle="Talk, meet, recommend" icon={MessageSquare} variant="slate" />
              <div className="space-y-1.5">
                {general && <SectionCard {...general} />}
                {introduce && <SectionCard {...introduce} />}
                {recommendations && <SectionCard {...recommendations} />}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <CategoryHeader title="Requests" subtitle="Ask for it — the crowd funds it" icon={Zap} variant="indigo" />
            <div className="space-y-1.5">
              {requested.map((s) => (
                <SectionCard key={s.id} {...s} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <CategoryHeader title="Live Listings" subtitle="Uploads open for funding" icon={Users} variant="emerald" />
            <div className="space-y-1.5">
              {listed.map((s) => (
                <SectionCard key={s.id} {...s} />
              ))}
            </div>
          </div>
          </div>

          {/* Right rail: what's hot */}
          <div className="hidden md:block space-y-4">
            <TrendingSidebar />
            <PopularRail />
          </div>
        </div>
      </div>
    </div>
  );
}
