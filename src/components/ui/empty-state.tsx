import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-10 text-center space-y-4">
      {Icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      )}
      {emoji && !Icon && <div className="text-4xl">{emoji}</div>}
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {actionLabel && actionHref && (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
        {secondaryActionLabel && secondaryActionHref && (
          <Button asChild variant="outline">
            <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
