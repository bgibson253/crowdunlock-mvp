"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  why_it_matters: z.string().min(100, "Minimum 100 characters"),
  tags: z.string().optional(),
  unlock_goal: z
    .number()
    .int()
    .min(10, "Minimum $10")
    .max(100000, "Max $100,000"),
  content_type: z.enum(["story", "video", "data"], {
    message: "Pick a type",
  }),
  category_slug: z.string().min(1, "Pick a category"),
  unlock_mode: z.enum(["instant", "timed_24h", "timed_48h", "timed_7d", "manual"]),
  file: z
    .custom<File>((v) => v instanceof File, "File is required")
    .refine((f) => f.size <= 100 * 1024 * 1024, "Max 100MB"),
});

type Values = z.infer<typeof schema>;

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

export function UploadDraftForm({ categories = [] }: { categories?: Category[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const [tagInput, setTagInput] = React.useState("");
  const [tagList, setTagList] = React.useState<string[]>([]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      why_it_matters: "",
      tags: "",
      unlock_goal: 500,
      content_type: "story",
      category_slug: "",
      unlock_mode: "instant",
    },
  });

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (tag && !tagList.includes(tag) && tagList.length < 10) {
      const newTags = [...tagList, tag];
      setTagList(newTags);
      form.setValue("tags", newTags.join(","));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    const newTags = tagList.filter((t) => t !== tag);
    setTagList(newTags);
    form.setValue("tags", newTags.join(","));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && tagInput === "" && tagList.length > 0) {
      removeTag(tagList[tagList.length - 1]);
    }
  }

  async function onSubmit(values: Values) {
    setError(null);

    const body = new FormData();
    body.set("title", values.title);
    body.set("why_it_matters", values.why_it_matters);
    body.set("tags", tagList.join(","));
    body.set("unlock_goal", String(values.unlock_goal));
    body.set("content_type", values.content_type);
    body.set("category_slug", values.category_slug);
    body.set("unlock_mode", values.unlock_mode);
    body.set("file", values.file);

    const res = await fetch("/api/test/create-upload", {
      method: "POST",
      body,
    });

    if (!res.ok) {
      const txt = await res.text();
      setError(txt || "Request failed");
      return;
    }

    const data = (await res.json()) as { ok: boolean; uploadId: string };
    window.location.assign(`/uploads/${data.uploadId}`);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        <div className="font-semibold">TEST MODE</div>
        <div>Uploads are free + instant. Payments are disabled.</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="A leaked memo, a deck, an analysis…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unlock_goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unlock goal ($)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={String(field.value ?? "")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      const normalized = raw.replace(/^0+(?=\d)/, "");
                      field.onChange(normalized === "" ? 0 : Number(normalized));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unlock_mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unlock Timing</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="When should content unlock?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="instant">Instant (unlocks as soon as fully funded)</SelectItem>
                    <SelectItem value="timed_24h">24 hours after funded</SelectItem>
                    <SelectItem value="timed_48h">48 hours after funded</SelectItem>
                    <SelectItem value="timed_7d">7 days after funded</SelectItem>
                    <SelectItem value="manual">Manual (you unlock it yourself)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="why_it_matters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Why it matters</FormLabel>
                <FormControl>
                  <Textarea
                    rows={6}
                    placeholder="Tell people why the world should see this…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags with pill UI */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border/50 bg-card/50 px-3 py-2 min-h-[2.5rem]">
              {tagList.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                placeholder={tagList.length === 0 ? "biotech, finance, policy…" : ""}
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">Press Enter or comma to add. Max 10.</p>
          </div>

          <FormField
            control={form.control}
            name="file"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            render={({ field: _field }) => (
              <FormItem>
                <FormLabel>File (≤ 100MB)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="application/pdf,image/*,video/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) form.setValue("file", f, { shouldValidate: true });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Upload (free, test mode)
          </Button>
        </form>
      </Form>
    </div>
  );
}
