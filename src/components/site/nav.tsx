import Link from "next/link";

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

function SheetNavLinks({ user }: { user: any }) {
  return (
    <div className="mt-6 space-y-2">
      <Link href="/" className="block px-3 py-2 text-sm hover:underline">
        Home
      </Link>
      <Link href="/forum" className="block px-3 py-2 text-sm hover:underline">
        Forum
      </Link>
      <Link href="/browse" className="block px-3 py-2 text-sm hover:underline">
        Browse
      </Link>
      <Link href="/upload" className="block px-3 py-2 text-sm hover:underline">
        Upload
      </Link>
      {user && (
        <Link
          href="/dashboard"
          className="block px-3 py-2 text-sm hover:underline"
        >
          Dashboard
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
        .select("id,username,avatar_url")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <header className="border-b">
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

              <SheetNavLinks user={user} />

              {user ? (
                <div className="mt-6 border-t pt-4">
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

        {/* keep right side minimal when hamburger is primary */}
        <div className="flex items-center gap-2">
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
