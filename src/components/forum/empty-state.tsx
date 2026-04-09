import { Card, CardContent } from "@/components/ui/card";

export function ForumEmptyState() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="py-10">
        <div className="text-sm font-medium">No threads yet</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first! Request content, ask a question, or share what you want
          unlocked next.
        </p>
        <div className="mt-6 grid gap-3">
          <div className="rounded-xl border bg-background p-4">
            <div className="text-xs font-medium text-muted-foreground">
              Example thread
            </div>
            <div className="mt-1 font-medium tracking-tight">
              “Please upload a tutorial on X”
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Include: what you want, why it matters, your budget/interest, and
              any links.
            </div>
          </div>
          <div className="rounded-xl border bg-background p-4">
            <div className="text-xs font-medium text-muted-foreground">
              Example thread
            </div>
            <div className="mt-1 font-medium tracking-tight">
              “Can we unlock this dataset?”
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Share the source, licensing notes, and target unlock price.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
