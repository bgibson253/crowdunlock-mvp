import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { ForumSearchPage } from "@/components/forum/forum-search";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: sections } = await supabase
    .from("forum_sections")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="text-sm text-muted-foreground mb-4">
          <Link className="hover:underline" href="/forum">
            Forum
          </Link>{" "}
          <span className="mx-1">›</span>
          <span className="text-foreground">Search</span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight mb-4">
          Search Forum
        </h1>

        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
          <ForumSearchPage sections={(sections ?? []) as any[]} />
        </Suspense>
      </div>
    </div>
  );
}
