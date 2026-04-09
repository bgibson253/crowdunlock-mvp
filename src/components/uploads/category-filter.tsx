"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/supabase/browse";

export function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.delete("page"); // reset pagination on filter change
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const pills = [{ slug: null, name: "All", icon: "🔥" }, ...categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }))];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((p) => {
        const isActive = p.slug === activeSlug;
        return (
          <Link
            key={p.slug ?? "all"}
            href={buildHref(p.slug)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-card/50 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground hover:border-primary/30"
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
