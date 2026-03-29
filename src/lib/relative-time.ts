export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;

  const d = new Date(dateStr);
  const thisYear = new Date().getFullYear();
  const month = d.toLocaleString("en", { month: "short" });
  const day = d.getDate();
  if (d.getFullYear() === thisYear) return `${month} ${day}`;
  return `${month} ${day}, ${d.getFullYear()}`;
}
