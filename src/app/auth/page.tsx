import { Suspense } from "react";
import { cookies } from "next/headers";
import { AuthForm } from "@/components/auth/auth-form";

function AuthPageInner({
  redirectTo,
  refCode,
}: {
  redirectTo: string;
  refCode?: string;
}) {
  return (
    <main className="relative isolate min-h-[80vh] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="gradient-text text-3xl font-bold tracking-tight">Unmaskr</h1>
          <p className="mt-2 text-sm text-muted-foreground">You decide what gets uncovered.</p>
          {refCode && (
            <p className="mt-1 text-xs text-primary">You were invited! Create an account to get started.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-primary/5">
          <h2 className="text-lg font-semibold mb-6">Sign in</h2>
          <AuthForm requireUsername redirectTo={redirectTo} refCode={refCode} />
        </div>
      </div>
    </main>
  );
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  // Referral attribution: explicit ?ref= wins; otherwise fall back to the
  // 30-day cookie set by middleware when they first landed on a shared link.
  const cookieStore = await cookies();
  const cookieRef = cookieStore.get("unmaskr_ref")?.value;
  const refCode = sp.ref || cookieRef || undefined;

  return (
    <Suspense>
      <AuthPageInner redirectTo={sp.redirect || "/browse"} refCode={refCode} />
    </Suspense>
  );
}
