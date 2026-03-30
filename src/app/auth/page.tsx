import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

function AuthPageInner({ searchParams }: { searchParams: { redirect?: string } }) {
  const redirectTo = searchParams.redirect || "/browse";

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
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-primary/5">
          <h2 className="text-lg font-semibold mb-6">Sign in</h2>
          <AuthForm requireUsername redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Suspense>
      <AuthPageInner searchParams={sp} />
    </Suspense>
  );
}
