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
            "rounded-full border px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:border-indigo-200",
            active === s.id &&
              "bg-indigo-600 text-white border-indigo-600 hover:text-white hover:border-indigo-600"
          )}
        >
          {s.name}
        </Link>
      ))}
    </div>
  );
}
