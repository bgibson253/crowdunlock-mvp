import { redirect } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";
import { LiveHostPanel } from "@/components/live/live-host-panel";

export const dynamic = "force-dynamic";

export default async function LiveHostPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/live/host");

  // Host page does not require username (ever).
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Go live</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start streaming instantly. No username required.
        </p>
      </div>

      <LiveHostPanel />
    </div>
  );
}
