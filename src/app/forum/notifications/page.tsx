import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { NotificationsPage } from "@/components/forum/notifications-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

export default async function ForumNotificationsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth");
  }

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-background to-background" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="text-sm text-muted-foreground mb-4">
          <Link className="hover:underline" href="/forum">
            Forum
          </Link>{" "}
          <span className="mx-1">›</span>
          <span className="text-foreground">Notifications</span>
        </div>
        <NotificationsPage userId={data.user.id} />
      </div>
    </div>
  );
}
