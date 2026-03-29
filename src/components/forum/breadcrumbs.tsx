import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {item.href ? (
            <Link className="hover:underline hover:text-foreground transition" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground truncate max-w-[300px]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
