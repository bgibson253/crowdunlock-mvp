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

function HamburgerButton() {
  return (
    <button
      type="button"
      aria-label="Open menu"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted"
    >
      <span className="sr-only">Open navigation</span>
      <div className="flex flex-col gap-1">
        <span className="h-0.5 w-5 bg-current" />
        <span className="h-0.5 w-5 bg-current" />
        <span className="h-0.5 w-5 bg-current" />
      </div>
    </button>
  );
}

function SheetNavLinks({ user, unreadDmCount, isAdmin }: { user: any; unreadDmCount: number; isAdmin: boolean }) {
  return (
    <div className="mt-6 space-y-1">
      <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md">
        <Home className="h-4 w-4 text-muted-foreground" />
        Home
      </Link>
      <Link href="/forum" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        Forum
      </Link>
      <Link href="/forum/perks" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md">
        <Trophy className="h-4 w-4 text-muted-foreground" />
        Unlock perks
      </Link>
      <Link href="/browse" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md">
        <Compass className="h-4 w-4 text-muted-foreground" />
        Browse
      </Link>
      {user && (
        <Link
          href="/forum/notifications"
          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          Notifications
        </Link>
      )}
      {user && (
        <Link
          href="/messages"
          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md"
        >
          <Mail className="h-4 w-4 text-muted-foreground" />
          Messages{unreadDmCount > 0 ? ` (${unreadDmCount})` : ""}
        </Link>
      )}
      {isAdmin && (
        <Link
          href="/forum/reports"
          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md text-amber-600 font-medium"
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

  // Count unread DMs for the logged-in user
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
    <header className="sticky top-0 z-50 border-b backdrop-blur-md bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <HamburgerButton />
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="hover:underline">
                    Unmaskr
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <SheetNavLinks user={user} unreadDmCount={unreadDmCount} isAdmin={profile?.is_admin ?? false} />

              {user ? (
                <div className="mt-6 border-t pt-4 space-y-1">
                  <Link href="/profile/settings" className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-md">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.username ?? "User"} />
                      ) : null}
                      <AvatarFallback>
                        {(profile?.username ?? "U").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-4 line-clamp-1">
                        {profile?.username ?? user.email ?? "Account"}
                      </div>
                      <div className="text-xs text-muted-foreground">Profile & settings</div>
                    </div>
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    My uploads
                  </Link>
                  <Link href="/upload" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    New upload
                  </Link>
                  <Link href="/forum/favorites" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    Favorites
                  </Link>
                </div>
              ) : null}

              <div className="mt-6 border-t pt-4">
                {user ? (
                  <form action="/auth/signout" method="post">
                    <Button variant="outline" type="submit" className="w-full">
                      Sign out
                    </Button>
                  </form>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/auth">Sign in</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="font-semibold tracking-tight">
            Unmaskr
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user && <NotificationBell userId={user.id} />}
          {user ? (
            <form action="/auth/signout" method="post" className="hidden sm:block">
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
