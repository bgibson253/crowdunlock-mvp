import Link from "next/link";
import {
  Home,
  MessageSquare,
  Trophy,
  Compass,
  Bell,
  Mail,
  Flag,
  Heart,
  Upload,
  Plus,
  Menu,
} from "lucide-react";

import { supabaseServer } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/forum/notification-bell";

function NavLink({ href, icon: Icon, label, badge }: { href: string; icon: any; label: string; badge?: number }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg transition-all duration-150"
    >
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function SheetNavLinks({ user, unreadDmCount, isAdmin }: { user: any; unreadDmCount: number; isAdmin: boolean }) {
  return (
    <div className="mt-6 space-y-0.5">
      <NavLink href="/" icon={Home} label="Home" />
      <NavLink href="/forum" icon={MessageSquare} label="Forum" />
      <NavLink href="/forum/perks" icon={Trophy} label="Unlock Perks" />
      <NavLink href="/leaderboard" icon={Trophy} label="Leaderboard" />
      <NavLink href="/browse" icon={Compass} label="Browse" />
      {user && <NavLink href="/forum/notifications" icon={Bell} label="Notifications" />}
      {user && <NavLink href="/messages" icon={Mail} label="Messages" badge={unreadDmCount} />}
      {isAdmin && (
        <Link
          href="/forum/reports"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-amber-500 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg transition-all duration-150"
        >
          <Flag className="h-4 w-4" />
          Reports
        </Link>
      )}
    </div>
  );
}

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
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card hover:border-primary/30 transition-all duration-150"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 border-r border-border/50 bg-background/95 backdrop-blur-xl">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="gradient-text text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
                    Unmaskr
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <SheetNavLinks user={user} unreadDmCount={unreadDmCount} isAdmin={profile?.is_admin ?? false} />

              {user ? (
                <div className="mt-6 border-t border-border/50 pt-4 space-y-0.5">
                  <Link href="/profile/settings" className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 rounded-lg transition-all duration-150">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.username ?? "User"} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {(profile?.username ?? "U").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-4 line-clamp-1">
                        {profile?.username ?? user.email ?? "Account"}
                      </div>
                      <div className="text-xs text-muted-foreground">Profile & settings</div>
                    </div>
                  </Link>
                  <NavLink href="/dashboard" icon={Upload} label="My Uploads" />
                  <NavLink href="/upload" icon={Plus} label="New Upload" />
                  <NavLink href="/forum/favorites" icon={Heart} label="Favorites" />
                </div>
              ) : null}

              <div className="mt-6 border-t border-border/50 pt-4">
                {user ? (
                  <form action="/auth/signout" method="post">
                    <Button variant="outline" type="submit" className="w-full border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                      Sign out
                    </Button>
                  </form>
                ) : (
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Link href="/auth">Sign in</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="gradient-text font-bold tracking-tight text-lg">
            Unmaskr
          </Link>
        </div>

        <div className="flex items-center gap-2">
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
