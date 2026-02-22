import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function UploadSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Next: we’ll run AI screening + teaser generation, then store your file privately and open funding.
          </p>
          <p className="text-xs">Stripe session: {session_id ?? "(missing)"}</p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/browse">Browse</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
