import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("launch_waitlist")
    .select("id,email,source,created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  return new NextResponse(
    [
      "id,email,source,created_at",
      ...(data ?? []).map((row) =>
        [
          row.id,
          row.email,
          row.source ?? "",
          row.created_at ?? "",
        ]
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n"),
    {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=launch-waitlist.csv",
      },
    }
  );
}
