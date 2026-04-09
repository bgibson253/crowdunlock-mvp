"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings,
  LogOut,
  LogIn,
  Rss,
  Bookmark,
  UserPlus,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

function NavLink({
  href,
  icon: Icon,
  label,
  badge,
  onClick,
  variant,
}: {
  href: string;
  icon: any;
  label: string;
  badge?: number;
  onClick?: () => void;
  variant?: "default" | "warning";
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.98] ${
        variant === "warning"
          ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/5"
          : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 transition-colors ${
        variant === "warning"
          ? "text-amber-500"
          : "text-muted-foreground group-hover:text-primary"
      }`} />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
      {children}
    </p>
  );
}

export function MobileSheet({
  user,
  profile,
  unreadDmCount,
  isAdmin,
}: {
  user: any;
  profile: any;
  unreadDmCount: number;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sheet on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card hover:border-primary/30 transition-all duration-150 active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-80 border-r border-border/50 bg-background/95 backdrop-blur-xl p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-5 pb-2">
          <SheetTitle>
            <Link href="/" onClick={close} className="gradient-text text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
              Unmaskr
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {/* Browse section */}
          <SectionLabel>Browse</SectionLabel>
          <div className="space-y-0.5">
            <NavLink href="/" icon={Home} label="Home" onClick={close} />
            <NavLink href="/forum" icon={MessageSquare} label="Forum" onClick={close} />
            <NavLink href="/browse" icon={Compass} label="Browse Uploads" onClick={close} />
            <NavLink href="/leaderboards" icon={Trophy} label="Leaderboards" onClick={close} />
            <NavLink href="/blog" icon={BookOpen} label="Blog" onClick={close} />
            <NavLink href="/forum/perks" icon={Trophy} label="Unlock Perks" onClick={close} />
          </div>

          {user && (
            <>
              <Separator className="my-3 mx-2" />
              <SectionLabel>Your Stuff</SectionLabel>
              <div className="space-y-0.5">
                <NavLink href="/feed" icon={Rss} label="Feed" onClick={close} />
                <NavLink href="/forum/notifications" icon={Bell} label="Notifications" onClick={close} />
                <NavLink href="/messages" icon={Mail} label="Messages" badge={unreadDmCount} onClick={close} />
                <NavLink href="/forum/favorites" icon={Heart} label="Favorites" onClick={close} />
                <NavLink href="/watchlist" icon={Bookmark} label="Watchlist" onClick={close} />
                <NavLink href="/dashboard" icon={Upload} label="My Uploads" onClick={close} />
                <NavLink href="/dashboard/analytics" icon={BarChart3} label="Analytics" onClick={close} />
                <NavLink href="/invite" icon={UserPlus} label="Invite Friends" onClick={close} />
                <NavLink href="/upload" icon={Plus} label="New Upload" onClick={close} />
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <Separator className="my-3 mx-2" />
              <SectionLabel>Admin</SectionLabel>
              <div className="space-y-0.5">
                <NavLink href="/forum/reports" icon={Flag} label="Reports" onClick={close} variant="warning" />
              </div>
            </>
          )}
        </div>

        {/* Bottom section - account */}
        <div className="border-t border-border/50 px-2 py-3 space-y-1">
          {user ? (
            <>
              <Link
                href="/profile/settings"
                onClick={close}
                className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-primary/5 rounded-lg transition-all duration-150 active:scale-[0.98]"
              >
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 shrink-0">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.username ?? "User"} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(profile?.username ?? "U").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-4 line-clamp-1">
                    {profile?.username ?? "Account"}
                  </div>
                  <div className="text-xs text-muted-foreground">Profile & settings</div>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-4 py-3 min-h-[44px] text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all duration-150 active:scale-[0.98]"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/auth"
              onClick={close}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg shadow-primary/20 transition-all duration-150 active:scale-[0.98]"
            >
              <LogIn className="h-5 w-5" />
              Sign in
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
