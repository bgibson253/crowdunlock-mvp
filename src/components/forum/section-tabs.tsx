import Link from "next/link";

import { cn } from "@/lib/utils";

export type ForumSection = {
  id: string;
  name: string;
  description: string | null;
};

export function SectionTabs({
  sections,
  active,
}: {
  sections: ForumSection[];
  active: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((s) => (
        <Link
          key={s.id}
          href={s.id === "all" ? "/forum" : `/forum?section=${encodeURIComponent(s.id)}`}
          className={cn(
            "rounded-full border px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:border-primary/25",
            active === s.id &&
              "bg-primary text-white border-primary hover:text-white hover:border-primary"
          )}
        >
          {s.name}
        </Link>
      ))}
    </div>
  );
}
