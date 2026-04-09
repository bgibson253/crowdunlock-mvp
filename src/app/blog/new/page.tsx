import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { BlogPostEditor } from "@/components/blog/blog-post-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New Blog Post" };

export default async function NewBlogPostPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=%2Fblog%2Fnew");

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/blog");

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-8">New Blog Post</h1>
        <BlogPostEditor mode="create" />
      </div>
    </main>
  );
}
