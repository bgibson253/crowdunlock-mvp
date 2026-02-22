import { redirect } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { NewThreadForm } from "@/components/forum/new-thread-form";

export const dynamic = "force-dynamic";

export default async function ForumNewThreadPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">New thread</h1>
      <NewThreadForm />
    </div>
  );
}
