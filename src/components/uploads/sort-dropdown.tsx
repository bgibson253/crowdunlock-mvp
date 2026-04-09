"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { BrowseSort } from "@/lib/supabase/browse";

const SORT_OPTIONS: { value: BrowseSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "most_funded", label: "Most Funded" },
  { value: "trending", label: "Trending" },
  { value: "almost_unlocked", label: "Almost Unlocked" },
];

export function SortDropdown({ activeSort }: { activeSort: BrowseSort }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(sort: BrowseSort) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    params.delete("page"); // reset pagination on sort change
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex items-center gap-2">
      {SORT_OPTIONS.map((opt) => {
        const isActive = opt.value === activeSort;
        return (
          <Link
            key={opt.value}
            href={buildHref(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150 ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-card/50 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground hover:border-primary/30"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
