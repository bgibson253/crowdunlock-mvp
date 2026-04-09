"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";

const blogSchema = z.object({
  title: z.string().min(3, "Title required").max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  meta_description: z.string().max(300).optional(),
  og_image_url: z.string().url().optional().or(z.literal("")),
  published: z.boolean(),
});

type BlogValues = z.infer<typeof blogSchema>;

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  body: string;
  meta_description: string | null;
  og_image_url: string | null;
  published: boolean;
};

export function BlogPostEditor({
  initial,
  mode,
}: {
  initial?: BlogPost;
  mode: "create" | "edit";
}) {
  const router = useRouter();

  const form = useForm<BlogValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      body: initial?.body ?? "",
      meta_description: initial?.meta_description ?? "",
      og_image_url: initial?.og_image_url ?? "",
      published: initial?.published ?? false,
    },
  });

  // Auto-generate slug from title
  const title = form.watch("title");
  React.useEffect(() => {
    if (mode === "create") {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 100);
      form.setValue("slug", slug);
    }
  }, [title, mode, form]);

  async function onSubmit(values: BlogValues) {
    const supabase = supabaseBrowser();

    if (mode === "create") {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("blog_posts").insert({
        title: values.title,
        slug: values.slug,
        body: values.body,
        meta_description: values.meta_description || null,
        og_image_url: values.og_image_url || null,
        published: values.published,
        published_at: values.published ? new Date().toISOString() : null,
        author_id: user?.id ?? null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Post created!");
      router.push(`/blog/${values.slug}`);
    } else if (initial) {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: values.title,
          slug: values.slug,
          body: values.body,
          meta_description: values.meta_description || null,
          og_image_url: values.og_image_url || null,
          published: values.published,
          published_at: values.published && !initial.published ? new Date().toISOString() : undefined,
        })
        .eq("id", initial.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Post updated!");
      router.push(`/blog/${values.slug}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Post title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="my-post-slug" {...field} />
              </FormControl>
              <FormDescription className="text-xs">URL path: /blog/{form.watch("slug")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body (Markdown)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your post in markdown..."
                  className="min-h-[300px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meta_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Description (SEO)</FormLabel>
              <FormControl>
                <Input placeholder="Brief description for search engines" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="og_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OG Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormDescription className="text-xs">Social media preview image</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-border"
                />
              </FormControl>
              <FormLabel className="!mt-0">Publish immediately</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {mode === "create" ? "Create Post" : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
