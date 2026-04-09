import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify caller is admin
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (!callerProfile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, isAdmin } = body;
    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Use service role to update is_admin (RLS may prevent self-update)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await adminClient
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
