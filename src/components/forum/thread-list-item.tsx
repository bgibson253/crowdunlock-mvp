import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

export function ThreadListItem({
  id,
  title,
  createdAt,
}: {
  id: string;
  title: string;
  createdAt: string;
}) {
  return (
    <Card className="transition hover:border-indigo-200 hover:bg-indigo-50/30">
      <CardContent className="py-4">
        <Link
          className="font-medium tracking-tight hover:underline"
          href={`/forum/${id}`}
        >
          {title}
        </Link>
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(createdAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
