import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { envServer, isTestMode } from "@/lib/env";
import { isTestUser } from "@/lib/test-mode";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnlockAnyUploadPanel } from "@/components/test-admin/unlock-any-upload-panel";

export const dynamic = "force-dynamic";

export default async function TestAdminPage() {
  if (!isTestMode()) redirect("/browse");

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");
  if (!isTestUser(user.email)) redirect("/browse");

  const env = envServer();

  const { data: uploads, error } = await supabase
    .from("uploads")
    .select("id,title,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Test Admin Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-md border border-red-600/40 bg-red-600/5 p-3 text-sm text-red-700">
            <div className="font-semibold">TEST MODE</div>
            <div>Payments are disabled. Use this panel to unlock content for QA.</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Allowed user: {env.TEST_USER_EMAIL ?? "(not set)"}
            </div>
          </div>

          {error ? (
            <div className="rounded-md border p-3 text-sm text-destructive">{error.message}</div>
          ) : (
            <UnlockAnyUploadPanel uploads={(uploads ?? []) as any[]} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
