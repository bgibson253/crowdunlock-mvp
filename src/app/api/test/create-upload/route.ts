import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { envClient, envServer } from "@/lib/env";
import { requireTestMode } from "@/lib/test-mode";

export const runtime = "nodejs";

function listedSectionId(contentType: string) {
  if (contentType === "video") return "listed_videos";
  if (contentType === "data") return "listed_data";
  if (contentType === "document") return "listed_documents";
  if (contentType === "image") return "listed_images";
  if (contentType === "other") return "listed_other";
  return "listed_stories";
}

export async function POST(req: Request) {
  const gate = requireTestMode();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 404 });

  const envC = envClient();
  const envS = envServer();

  if (!envS.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is missing" },
      { status: 500 },
    );
  }

  // TEST_MODE QA endpoint uses service role to avoid auth/RLS friction.
  const supabase = createClient(envC.NEXT_PUBLIC_SUPABASE_URL, envS.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const form = await req.formData();
  const title = String(form.get("title") ?? "");
  const why = String(form.get("why_it_matters") ?? "");
  const tagsRaw = String(form.get("tags") ?? "");
  const unlockGoalRaw = String(form.get("unlock_goal") ?? "500");
  const contentType = String(form.get("content_type") ?? "story");
  const categorySlug = String(form.get("category_slug") ?? "");
  const fundingDeadline = String(form.get("funding_deadline") ?? "90d");
  const file = form.get("file");

  const unlockGoal = Number.parseInt(unlockGoalRaw, 10);

  if (!title || !why || why.length < 100) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!Number.isFinite(unlockGoal) || unlockGoal < 10) {
    return NextResponse.json({ error: "Invalid unlock goal" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Try to get the actual signed-in user so uploads are owned by them
  // Fall back to null if no session (pure service-role test)
  const { cookies } = await import("next/headers");
  const { createServerClient } = await import("@supabase/ssr");
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    envC.NEXT_PUBLIC_SUPABASE_URL,
    envC.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
  const uploaderId: string | null = authUser?.id ?? null;

  // Check rate limit for uploads
  if (uploaderId) {
    const { data: rlData } = await supabase.rpc("rate_limit_info", {
      p_user_id: uploaderId,
      p_action_type: "upload",
    });
    if (rlData && !rlData.allowed) {
      return NextResponse.json(
        { error: `Rate limited: max ${rlData.limit} uploads per ${rlData.window}. You have ${rlData.remaining} remaining.` },
        { status: 429 },
      );
    }
  }

  // Resolve category_id from slug
  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: catRow } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (catRow) categoryId = catRow.id;
  }

  const ext = file.name.split(".").pop() || "bin";
  const objectName = `${crypto.randomUUID()}/${crypto.randomUUID()}.${ext}`;
  const filePath = `uploads/${objectName}`;

  const { error: uploadErr } = await supabase.storage
    .from("uploads")
    .upload(objectName, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 400 });
  }

  const { data: uploadRow, error: insErr } = await supabase
    .from("uploads")
    .insert({
      title,
      why_it_matters: why,
      tags,
      uploader_id: uploaderId,
      file_path: filePath,
      ai_teaser: "(Teaser pending)",
      quality_score: null,
      status: "funding",
      current_funded: 0,
      funding_goal: unlockGoal * 100,
      posting_fee_payment_intent_id: null,
      category_id: categoryId,
      funding_deadline: ["30d","60d","90d","180d","365d","none"].includes(fundingDeadline) ? fundingDeadline : "90d",
    })
    .select("id")
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  // Save tags to upload_tags table
  if (tags.length > 0 && uploadRow) {
    const tagRows = tags.map((t) => ({ upload_id: uploadRow.id, tag: t.toLowerCase() }));
    await supabase.from("upload_tags").insert(tagRows);
  }

  // Auto-create forum thread in the appropriate listed_* section.
  // We create it as the uploader if present; otherwise as a "system" author.
  // In TEST_MODE, uploader_id is null, so author_id must be null-safe (schema may require auth FK).
  // If thread creation fails, don't block upload.
  const sectionId = listedSectionId(contentType);
  const threadTitle = `[LISTING] ${title}`;
  const threadBody = why;

  const { error: threadErr } = await supabase.from("forum_threads").insert({
    // Attempt to post as the same uploader (null in our test path). Will fail if author_id is NOT NULL.
    author_id: uploaderId,
    title: threadTitle,
    body: threadBody,
    section_id: sectionId,
    upload_id: uploadRow.id,
  } as any);

  if (threadErr) {
    // eslint-disable-next-line no-console
    console.error("forum thread create failed", threadErr.message);
  }

  // Check achievements for uploader
  if (authUser) {
    supabase.rpc("check_achievements", { p_user_id: authUser.id }).then(() => {});
  }

  // Auto-generate thumbnail (fire-and-forget)
  if (uploadRow) {
    fetch(new URL("/api/uploads/thumbnail", req.url).href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upload_id: uploadRow.id }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, uploadId: uploadRow.id });
}
