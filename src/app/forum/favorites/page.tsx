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
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-sm text-muted-foreground/70 mb-4">
          <Link className="hover:text-primary transition-colors font-medium" href="/forum">
            Forum
          </Link>{" "}
          <span className="mx-1 opacity-40">›</span>
          <span className="text-foreground font-semibold">Favorites</span>
        </div>
        <FavoritesPage userId={data.user.id} />
      </div>
    </div>
  );
}
