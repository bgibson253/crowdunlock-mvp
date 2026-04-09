import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/forum/notification-bell";
import { MobileSheet } from "@/components/site/mobile-sheet";

export async function Nav() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("id,username,avatar_url,is_admin")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  let unreadDmCount = 0;
  if (user) {
    const { count } = await supabase
      .from("forum_dms")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false);
    unreadDmCount = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <MobileSheet
            user={user}
            profile={profile}
            unreadDmCount={unreadDmCount}
            isAdmin={profile?.is_admin ?? false}
          />

          <Link href="/" className="gradient-text font-bold tracking-tight text-lg">
            Unmaskr
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
              aria-label="Admin Dashboard"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          )}
          {user && <NotificationBell userId={user.id} />}
          {user ? (
            <form action="/auth/signout" method="post" className="hidden sm:block">
              <Button variant="outline" size="sm" type="submit" className="border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                Sign out
              </Button>
            </form>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
