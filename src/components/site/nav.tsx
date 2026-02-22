import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";

export async function Nav() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          CrowdUnlock
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground">
            Browse
          </Link>
          <Link href="/upload" className="text-sm text-muted-foreground hover:text-foreground">
            Upload
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
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
      </div>
    </header>
  );
}
