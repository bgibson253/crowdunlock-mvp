import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { FavoritesPage } from "@/components/forum/favorites-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Favorites" };

export default async function ForumFavoritesPage() {
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
          <span className="text-foreground">Favorites</span>
        </div>
        <FavoritesPage userId={data.user.id} />
      </div>
    </div>
  );
}
