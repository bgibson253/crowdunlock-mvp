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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export async function Nav() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <span className="hidden md:inline-flex">
                <HamburgerButton />
              </span>
            </SheetTrigger>
            <SheetTrigger asChild>
              <span className="inline-flex md:hidden">
                <HamburgerButton />
              </span>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="hover:underline">
                    CrowdUnlock
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-2">
                <Link
                  href="/"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Home
                </Link>
                <Link
                  href="/forum"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Forum
                </Link>
                <Link
                  href="/browse"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Browse
                </Link>
                <Link
                  href="/upload"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Upload
                </Link>
                {user && (
                  <Link
                    href="/dashboard"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    Dashboard
                  </Link>
                )}
              </div>

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
            CrowdUnlock
          </Link>
        </div>

        <nav className="hidden items-center gap-4 md:flex">
          <NavLink href="/browse">Browse</NavLink>
          <NavLink href="/forum">Forum</NavLink>
          <NavLink href="/upload">Upload</NavLink>
          {user ? (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Sign in</Link>
            </Button>
          )}
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <HamburgerButton />
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="hover:underline">
                    CrowdUnlock
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-2">
                <Link
                  href="/"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Home
                </Link>
                <Link
                  href="/forum"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Forum
                </Link>
                <Link
                  href="/browse"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Browse
                </Link>
                <Link
                  href="/upload"
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Upload
                </Link>
                {user && (
                  <Link
                    href="/dashboard"
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    Dashboard
                  </Link>
                )}
              </div>

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
        </div>
      </div>
    </header>
  );
}
