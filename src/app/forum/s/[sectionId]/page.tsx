import Link from "next/link";
import { notFound } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThreadListItem } from "@/components/forum/thread-list-item";

export const dynamic = "force-dynamic";

export default async function ForumSectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;

  const supabase = await supabaseServer();

  const { data: section, error: sectionErr } = await supabase
    .from("forum_sections")
    .select("id,name,description")
    .eq("id", sectionId)
    .maybeSingle();

  if (sectionErr) throw new Error(sectionErr.message);
  if (!section) return notFound();

  const { data: threads, error: threadsErr } = await supabase
    .from("forum_threads")
    .select("id,title,created_at")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (threadsErr) throw new Error(threadsErr.message);

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-sm text-muted-foreground">
          <Link className="hover:underline" href="/forum">
            Forum
          </Link>{" "}
          <span className="mx-1">›</span>
          <span className="text-foreground">{section.name}</span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{section.name}</h1>
            {section.description && (
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            )}
          </div>
          <Button asChild>
            <Link href={`/forum/new?section=${encodeURIComponent(sectionId)}`}>
              New thread
            </Link>
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {(threads ?? []).map((t) => (
            <ThreadListItem
              key={t.id}
              id={t.id}
              title={t.title}
              createdAt={t.created_at}
            />
          ))}

          {(threads?.length ?? 0) === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="py-10">
                <div className="text-sm font-medium">No threads yet</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first to post in {section.name}.
                </p>
                <div className="mt-4">
                  <Button asChild>
                    <Link href={`/forum/new?section=${encodeURIComponent(sectionId)}`}>
                      Create a thread
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
