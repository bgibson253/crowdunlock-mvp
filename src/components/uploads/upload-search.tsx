"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function UploadSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
  }

  function handleClear() {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/browse?${qs}` : "/browse");
  }

  const hasQuery = searchParams.get("q");

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search uploads…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 pl-9 pr-3 text-sm bg-card/50 border-border/50"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" className="h-9">
        Search
      </Button>
      {hasQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground"
          title="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
