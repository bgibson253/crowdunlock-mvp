"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";

type ContentItem = {
  id: string;
  type: string;
  title: string | null;
  teaser: string | null;
  status: string;
  reply_count: number;
  metadata: any;
  author_id: string | null;
  author_username: string | null;
  author_display_name: string | null;
  created_at: string;
  updated_at: string;
};

type AuditEntry = {
  id: string;
  actor: string;
  content_item_id: string | null;
  action: string;
  payload: any;
  success: boolean;
  error: string | null;
  created_at: string;
};

export default function AgentDashboard() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function fetchAll() {
    setLoading(true);
    const { data } = await supabase
      .from("agent_all_content")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setItems(data ?? []);

    const { data: auditData } = await supabase
      .from("agent_action_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setAudit(auditData ?? []);

    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAction(postId: string, action: string, payload: any = {}) {
    const res = await fetch("/api/agent/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, action, payload }),
    });
    const json = await res.json();
    setActionLog((prev) => [
      `${new Date().toLocaleTimeString()} | ${action} on ${postId.slice(0, 8)}… → ${JSON.stringify(json)}`,
      ...prev,
    ]);
    fetchAll();
  }

  const statusColor: Record<string, string> = {
    visible: "bg-green-100 text-green-800",
    hidden: "bg-yellow-100 text-yellow-800",
    rejected: "bg-red-100 text-red-800",
    resolved: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Agent Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unified content stream &amp; moderation actions. All content in one query.
        </p>
      </div>

      {/* Action Log */}
      {actionLog.length > 0 && (
        <div className="rounded-md border p-3 bg-muted/50 space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action Log</h3>
          {actionLog.map((l, i) => (
            <pre key={i} className="text-xs font-mono whitespace-pre-wrap">{l}</pre>
          ))}
        </div>
      )}

      {/* Content Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">All Content ({items.length})</h2>
          <Button size="sm" variant="outline" onClick={fetchAll} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{item.type}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${statusColor[item.status] ?? "bg-muted text-muted-foreground"}`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.reply_count} replies
                  </span>
                </div>
                <p className="font-medium mt-1 line-clamp-1">{item.title ?? "(no title)"}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.teaser ?? ""}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  by {item.author_display_name ?? item.author_username ?? "anon"} · {new Date(item.created_at).toLocaleDateString()}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">{item.id}</p>
              </div>
              <div className="flex flex-wrap gap-1 sm:flex-col">
                <Button size="sm" variant="outline" onClick={() => runAction(item.id, "hide")}>Hide</Button>
                <Button size="sm" variant="outline" onClick={() => runAction(item.id, "unhide")}>Unhide</Button>
                <Button size="sm" variant="destructive" onClick={() => runAction(item.id, "reject")}>Reject</Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => runAction(item.id, "reply", { body: "Agent test reply 🤖" })}
                >
                  Reply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Audit Log ({audit.length})</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No actions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1 pr-2">Time</th>
                  <th className="py-1 pr-2">Action</th>
                  <th className="py-1 pr-2">Item</th>
                  <th className="py-1 pr-2">OK?</th>
                  <th className="py-1">Error</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="py-1 pr-2 font-mono">{new Date(a.created_at).toLocaleTimeString()}</td>
                    <td className="py-1 pr-2">{a.action}</td>
                    <td className="py-1 pr-2 font-mono">{a.content_item_id?.slice(0, 8) ?? "–"}</td>
                    <td className="py-1 pr-2">{a.success ? "✅" : "❌"}</td>
                    <td className="py-1 text-red-600">{a.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
