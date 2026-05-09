import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/constants";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Check admin auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create signed URL (20 minutes expiry)
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 60 * 20);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
