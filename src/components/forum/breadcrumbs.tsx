import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3 opacity-40" />}
          {item.href ? (
            <Link className="hover:text-primary transition-colors duration-150 font-medium" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-semibold truncate max-w-[300px]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
