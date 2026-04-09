import { createClient } from "@supabase/supabase-js";
import { envClient } from "@/lib/env";

export type BrowseSort = "newest" | "most_funded" | "trending" | "almost_unlocked";

export type BrowseUpload = {
  id: string;
  title: string;
  tags: string[] | null;
  ai_teaser: string | null;
  quality_score: number | null;
  status: string;
  funding_goal: number | null;
  current_funded: number | null;
  view_count: number;
  created_at: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_icon: string | null;
  uploader_id: string | null;
  uploader_username: string | null;
  uploader_avatar_url: string | null;
  total_count: number;
  thumbnail_url: string | null;
  file_path: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
};

export async function fetchCategories(): Promise<Category[]> {
  const env = envClient();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,icon,sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchBrowseUploads({
  categorySlug,
  tag,
  sort,
  limit,
  offset,
  callerId,
}: {
  categorySlug?: string | null;
  tag?: string | null;
  sort?: BrowseSort;
  limit?: number;
  offset?: number;
  callerId?: string | null;
}): Promise<{ uploads: BrowseUpload[]; totalCount: number }> {
  const env = envClient();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase.rpc("browse_uploads", {
    p_category_slug: categorySlug ?? null,
    p_tag: tag ?? null,
    p_sort: sort ?? "newest",
    p_limit: limit ?? 12,
    p_offset: offset ?? 0,
    p_caller_id: callerId ?? null,
  });

  if (error) throw error;

  const rows = (data ?? []) as BrowseUpload[];
  const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return { uploads: rows, totalCount };
}

export type SearchUpload = BrowseUpload & {
  rank: number;
};

export async function searchUploads({
  query,
  categorySlug,
  sort,
  limit,
  offset,
  callerId,
}: {
  query: string;
  categorySlug?: string | null;
  sort?: string;
  limit?: number;
  offset?: number;
  callerId?: string | null;
}): Promise<{ uploads: SearchUpload[]; totalCount: number }> {
  const env = envClient();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase.rpc("search_uploads", {
    p_query: query,
    p_category_slug: categorySlug ?? null,
    p_sort: sort ?? "relevance",
    p_limit: limit ?? 12,
    p_offset: offset ?? 0,
    p_caller_id: callerId ?? null,
  });

  if (error) throw error;

  const rows = (data ?? []) as SearchUpload[];
  const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return { uploads: rows, totalCount };
}
