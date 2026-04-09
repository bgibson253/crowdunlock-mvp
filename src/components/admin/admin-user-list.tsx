"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  last_seen_at: string | null;
  post_count: number;
  total_points: number;
};

export function AdminUserList({
  users,
  query,
  page,
  totalPages,
}: {
  users: UserRow[];
  query: string;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    router.push(`/admin/users?${params.toString()}`);
  }

  function buildPageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set("page", String(p));
    else params.delete("page");
    return `/admin/users?${params.toString()}`;
  }

  async function toggleAdmin(userId: string, currentIsAdmin: boolean) {
    setTogglingId(userId);
    try {
      const res = await fetch("/api/admin/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !currentIsAdmin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to toggle admin");
      }
      toast.success(`Admin ${currentIsAdmin ? "revoked" : "granted"} successfully.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or username…"
            className="pl-10"
            aria-label="Search users"
          />
        </div>
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="divide-y divide-border/30">
          {users.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No users found.
            </div>
          ) : (
            users.map((u) => {
              const name = u.display_name || u.username || "Anonymous";
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    {u.avatar_url ? (
                      <AvatarImage src={u.avatar_url} alt={name} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${u.id}`}
                        className="text-sm font-medium hover:underline line-clamp-1"
                      >
                        {name}
                      </Link>
                      {u.is_admin && (
                        <Badge className="bg-primary/15 text-primary text-[10px] px-1.5 py-0">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {u.username && <span>@{u.username}</span>}
                      <span>{u.post_count} posts</span>
                      <span>{(u.total_points ?? 0).toLocaleString()} pts</span>
                      <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant={u.is_admin ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => toggleAdmin(u.id, u.is_admin)}
                    disabled={togglingId === u.id}
                    className="shrink-0 gap-1.5 text-xs"
                    aria-label={u.is_admin ? `Revoke admin from ${name}` : `Grant admin to ${name}`}
                  >
                    {u.is_admin ? (
                      <>
                        <ShieldOff className="h-3.5 w-3.5" />
                        Revoke Admin
                      </>
                    ) : (
                      <>
                        <Shield className="h-3.5 w-3.5" />
                        Make Admin
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageHref(page - 1)}>← Previous</Link>
            </Button>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={buildPageHref(page + 1)}>Next →</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
