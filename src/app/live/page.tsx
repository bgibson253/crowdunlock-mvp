import { redirect } from "next/navigation";
import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LiveHomePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/live");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your stream, or watch people you follow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Host</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Go live instantly. Username is optional.
          </div>
          <Button asChild>
            <Link href="/live/host">Go live</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        View links look like <span className="font-mono">/live/u/&lt;userId&gt;</span>
        . Vanity usernames will redirect later.
      </div>
    </div>
  );
}
