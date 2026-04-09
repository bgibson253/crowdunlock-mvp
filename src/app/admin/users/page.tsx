import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { AdminUserList } from "@/components/admin/admin-user-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "User Management — Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=/admin/users");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect("/");

  const sp = await searchParams;
  const query = sp.q?.trim() || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  let usersQuery = supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,is_admin,created_at,last_seen_at,post_count,total_points", { count: "exact" });

  if (query) {
    usersQuery = usersQuery.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
  }

  const { data: users, count } = await usersQuery
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {count ?? 0} total users
          </p>
        </div>

        <AdminUserList
          users={(users as any[]) ?? []}
          query={query}
          page={page}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
