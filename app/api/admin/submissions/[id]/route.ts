import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/constants";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
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

  // Get submission details to delete images
  const { data: submission } = await supabase
    .from("submissions")
    .select("before_image_path, after_image_path")
    .eq("id", id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Delete images from storage using service role
  const serviceClient = createServiceRoleClient();
  const imagePaths = [
    submission.before_image_path,
    submission.after_image_path,
  ].filter(Boolean);
  
  if (imagePaths.length > 0) {
    await serviceClient.storage.from(STORAGE_BUCKET).remove(imagePaths);
  }

  // Delete submission from database
  const { error } = await supabase.from("submissions").delete().eq("id", id);

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
