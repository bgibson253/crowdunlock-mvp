import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { envClient } from "@/lib/env";

/**
 * POST /api/uploads/thumbnail
 * Body: { upload_id }
 * Generates a thumbnail from the uploaded image file and stores it in Supabase storage.
 * Called automatically after upload creation if the file is an image.
 */
export async function POST(req: NextRequest) {
  try {
    const { upload_id } = await req.json();
    if (!upload_id) {
      return NextResponse.json({ error: "upload_id required" }, { status: 400 });
    }

    const env = envClient();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);

    // Get the upload's file_path
    const { data: upload } = await supabase
      .from("uploads")
      .select("id, file_path, thumbnail_url")
      .eq("id", upload_id)
      .maybeSingle();

    if (!upload?.file_path) {
      return NextResponse.json({ error: "Upload not found or no file" }, { status: 404 });
    }

    // Already has thumbnail
    if (upload.thumbnail_url) {
      return NextResponse.json({ ok: true, thumbnail_url: upload.thumbnail_url });
    }

    // Extract the object name (file_path = "uploads/{uuid}/{uuid}.ext")
    const objectName = upload.file_path.replace(/^uploads\//, "");

    // Download the file from storage
    const { data: blob, error: dlErr } = await supabase.storage
      .from("uploads")
      .download(objectName);

    if (dlErr || !blob) {
      return NextResponse.json({ error: dlErr?.message ?? "Download failed" }, { status: 500 });
    }

    // Check if it's an image
    const ct = blob.type ?? "";
    if (!ct.startsWith("image/")) {
      return NextResponse.json({ ok: true, thumbnail_url: null, reason: "Not an image" });
    }

    // Use sharp to resize
    const sharp = (await import("sharp")).default;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const thumbBuffer = await sharp(buffer)
      .resize(400, 300, { fit: "cover", withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();

    // Upload thumbnail
    const thumbObjectName = `thumbnails/${upload_id}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("uploads")
      .upload(thumbObjectName, thumbBuffer, {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Get the public URL
    const { data: publicUrl } = supabase.storage
      .from("uploads")
      .getPublicUrl(thumbObjectName);

    const thumbnailUrl = publicUrl.publicUrl;

    // Update the upload record
    await supabase
      .from("uploads")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", upload_id);

    return NextResponse.json({ ok: true, thumbnail_url: thumbnailUrl });
  } catch (err: any) {
    console.error("[thumbnail]", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
