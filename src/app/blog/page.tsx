import Link from "next/link";
import type { Metadata } from "next";

import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export const metadata: Metadata = {
  title: "Blog | Unmaskr",
  description: "Insights, updates, and stories from the Unmaskr team.",
  openGraph: {
    title: "Blog | Unmaskr",
    description: "Insights, updates, and stories from the Unmaskr team.",
    type: "website",
    siteName: "Unmaskr",
  },
};

export default async function BlogPage() {
  const supabase = await supabaseServer();

  // Check if current user is admin for "New post" button
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

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id,slug,title,meta_description,published_at,og_image_url,author_id")
    .eq("published", true)
    .order("published_at", { ascending: false });

  // Fetch author profiles
  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id).filter(Boolean))];
  let authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id,username")
      .in("id", authorIds);
    for (const a of authors ?? []) {
      authorMap[a.id] = a.username ?? "Anonymous";
    }
  }

  return (
    <main className="relative isolate min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Insights, updates, and stories from the Unmaskr team.
            </p>
          </div>
          {isAdmin && (
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/blog/new">New Post</Link>
            </Button>
          )}
        </div>

        {(posts ?? []).length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card/50 p-10 text-center backdrop-blur-sm">
            <div className="text-3xl mb-2">📝</div>
            <p className="font-medium">No posts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon for updates and insights.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(posts ?? []).map((post) => {
              const date = post.published_at
                ? new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "";
              return (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="card-hover border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold line-clamp-2">{post.title}</h2>
                          {post.meta_description && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {post.meta_description}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                            {date && <span>{date}</span>}
                            {post.author_id && authorMap[post.author_id] && (
                              <span>by {authorMap[post.author_id]}</span>
                            )}
                          </div>
                        </div>
                        {post.og_image_url && (
                          <img
                            src={post.og_image_url}
                            alt=""
                            className="w-24 h-16 rounded-lg object-cover shrink-0"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
