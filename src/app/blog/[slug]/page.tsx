import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { MarkdownBody } from "@/components/forum/markdown-body";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await supabaseServer();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title,meta_description,og_image_url")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Unmaskr Blog`,
    description: post.meta_description ?? post.title,
    openGraph: {
      title: post.title,
      description: post.meta_description ?? post.title,
      type: "article",
      siteName: "Unmaskr",
      ...(post.og_image_url && { images: [{ url: post.og_image_url }] }),
    },
    twitter: {
      card: post.og_image_url ? "summary_large_image" : "summary",
      title: post.title,
      description: post.meta_description ?? post.title,
      ...(post.og_image_url && { images: [post.og_image_url] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await supabaseServer();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!post || !post.published) return notFound();

  // Check admin for edit button
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.is_admin ?? false;
  }

  // Fetch author
  let authorName = "Unmaskr Team";
  if (post.author_id) {
    const { data: author } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", post.author_id)
      .maybeSingle();
    authorName = author?.username ?? "Unmaskr Team";
  }

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All posts
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/blog/${slug}/edit`}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Link>
            </Button>
          )}
        </div>

        {post.og_image_url && (
          <img
            src={post.og_image_url}
            alt=""
            className="w-full h-auto rounded-xl mb-6 max-h-[400px] object-cover"
          />
        )}

        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          <span>{authorName}</span>
          {publishedDate && (
            <>
              <span>·</span>
              <span>{publishedDate}</span>
            </>
          )}
        </div>

        <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none">
          <MarkdownBody content={post.body} />
        </div>
      </article>
    </main>
  );
}
