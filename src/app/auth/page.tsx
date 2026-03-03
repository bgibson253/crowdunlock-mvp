import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AuthPageInner({ searchParams }: { searchParams: { redirect?: string } }) {
  const redirectTo = searchParams.redirect || "/browse";

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm requireUsername redirectTo={redirectTo} />
        </CardContent>
      </Card>
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
