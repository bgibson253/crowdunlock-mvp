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
  file: z
    .custom<File>((v) => v instanceof File, "File is required")
    .refine((f) => f.size <= 100 * 1024 * 1024, "Max 100MB"),
});

type Values = z.infer<typeof schema>;

export function UploadDraftForm() {
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      why_it_matters: "",
      tags: "",
      unlock_goal: 500,
      content_type: "story",
    },
  });

  async function onSubmit(values: Values) {
    setError(null);

    const body = new FormData();
    body.set("title", values.title);
    body.set("why_it_matters", values.why_it_matters);
    body.set("tags", values.tags ?? "");
    body.set("unlock_goal", String(values.unlock_goal));
    body.set("content_type", values.content_type);
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

      <div className="rounded-md border border-red-600/40 bg-red-600/5 p-3 text-sm text-red-700">
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
            name="unlock_goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unlock goal ($)</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" min={10} step={10} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                </FormControl>
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

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma-separated)</FormLabel>
                <FormControl>
                  <Input placeholder="biotech, finance, policy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
