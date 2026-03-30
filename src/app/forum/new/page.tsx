import { redirect } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { NewThreadForm } from "@/components/forum/new-thread-form";

export const dynamic = "force-dynamic";

export default async function ForumNewThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth");
  }

  const { section } = await searchParams;

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">New thread</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep it specific. One request per thread.
          </p>
        </div>
        <NewThreadForm defaultSectionId={section ?? null} />
      </div>
    </div>
  );
}
