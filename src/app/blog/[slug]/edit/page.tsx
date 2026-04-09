import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { BlogPostEditor } from "@/components/blog/blog-post-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit Blog Post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth?redirect=${encodeURIComponent(`/blog/${slug}/edit`)}`);

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/blog");

  // Fetch post
  const { data: post } = await supabase
    .from("blog_posts")
    .select("id,title,slug,body,meta_description,og_image_url,published")
    .eq("slug", slug)
    .maybeSingle();

  if (!post) return notFound();

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Edit Blog Post</h1>
        <BlogPostEditor mode="edit" initial={post} />
      </div>
    </main>
  );
}
