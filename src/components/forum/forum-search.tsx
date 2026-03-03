"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, Filter } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchThread = {
  id: string;
  title: string;
  snippet: string;
  section_id: string;
  author_name: string;
  created_at: string;
};

type SearchReply = {
  id: string;
  thread_id: string;
  thread_title: string;
  snippet: string;
  author_name: string;
  created_at: string;
};

type Section = { id: string; name: string };

export function ForumSearchPage({ sections, isLoggedIn = true }: { sections: Section[]; isLoggedIn?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [section, setSection] = useState(searchParams.get("section") || "all");
  const [threads, setThreads] = useState<SearchThread[]>([]);
  const [replies, setReplies] = useState<SearchReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(
    async (q: string, sec: string) => {
      setAuthRequired(false);
      if (!q || q.trim().length < 2) {
        setThreads([]);
        setReplies([]);
        setTotal(0);
        return;
      }
      if (!isLoggedIn) {
        setAuthRequired(true);
        setThreads([]);
        setReplies([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: q.trim() });
        if (sec && sec !== "all") params.set("section", sec);

        const res = await fetch(`/api/forum/search?${params}`);
        if (res.status === 401) {
          setAuthRequired(true);
          setThreads([]);
          setReplies([]);
          setTotal(0);
          return;
        }
        const data = await res.json();
        setThreads(data.threads || []);
        setReplies(data.replies || []);
        setTotal(data.total || 0);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const sec = searchParams.get("section") || "all";
    if (q) {
      setQuery(q);
      setSection(sec);
      doSearch(q, sec);
    }
  }, [searchParams, doSearch]);

  function handleInput(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (val.trim()) params.set("q", val.trim());
      if (section !== "all") params.set("section", section);
      router.replace(`/forum/search?${params}`);
      doSearch(val, section);
    }, 350);
  }

  function handleSectionChange(val: string) {
    setSection(val);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (val !== "all") params.set("section", val);
    router.replace(`/forum/search?${params}`);
    doSearch(query, val);
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search threads and replies…"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            className="pl-9"
            autoFocus
          />
          {query && (
            <button
              onClick={() => handleInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-indigo-50" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="min-w-[160px]">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Section
                </label>
                <Select value={section} onValueChange={handleSectionChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sections</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && authRequired && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm font-medium">Sign in to search the forum</p>
            <p className="text-xs text-muted-foreground mt-1">
              Search is available to logged-in members.
            </p>
            <Link href="/auth?redirect=%2Fforum%2Fsearch">
              <Button size="sm" className="mt-4">Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && !authRequired && query.trim().length >= 2 && (
        <>
          <div className="text-xs text-muted-foreground">
            {total} result{total !== 1 ? "s" : ""} for &ldquo;{query.trim()}
            &rdquo;
          </div>

          {threads.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Threads</h3>
              {threads.map((t) => (
                <Card
                  key={t.id}
                  className="transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <CardContent className="py-3">
                    <Link
                      href={`/forum/${t.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {t.snippet}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {t.section_id}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        by {t.author_name} •{" "}
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {replies.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Replies</h3>
              {replies.map((r) => (
                <Card
                  key={r.id}
                  className="transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <CardContent className="py-3">
                    <Link
                      href={`/forum/${r.thread_id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {r.thread_title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {r.snippet}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      by {r.author_name} •{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {threads.length === 0 && replies.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No results found. Try different keywords.
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!loading && !authRequired && query.trim().length < 2 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
