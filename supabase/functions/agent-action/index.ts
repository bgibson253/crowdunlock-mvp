// Minimal secure agent action endpoint
// POST { post_id, action, payload }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-openclaw-agent-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const extraGate = Deno.env.get("OPENCLAW_AGENT_KEY");
  if (extraGate) {
    const got = req.headers.get("x-openclaw-agent-key");
    if (!got || got !== extraGate) return json(401, { ok: false, error: "invalid_agent_key" });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json(500, { ok: false, error: "missing_env" });

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let input: any;
  try {
    input = await req.json();
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const post_id = input?.post_id;
  const action = input?.action;
  const payload = input?.payload ?? {};
  if (!post_id || !action) return json(400, { ok: false, error: "missing_fields" });

  const { data, error } = await supabase.rpc("agent_apply_action", {
    p_content_item_id: post_id,
    p_action: action,
    p_payload: payload,
  });

  if (error) return json(500, { ok: false, error: error.message });
  return json(200, data);
});
