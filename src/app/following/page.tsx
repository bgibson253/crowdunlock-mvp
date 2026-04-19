import { FollowingList } from "@/components/following/following-list";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Following",
  description: "See people you follow and mutual friends. Live streams float to the top.",
};

export default function FollowingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Following</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live people are pinned to the top.
        </p>
      </div>
      <FollowingList />
    </div>
  );
}
