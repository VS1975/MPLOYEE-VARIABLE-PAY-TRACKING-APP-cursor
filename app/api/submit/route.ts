import { STORAGE_BUCKET } from "@/lib/constants";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { submitFormSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 2_500_000;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const before = form.get("before_image");
    const after = form.get("after_image");
    if (!(before instanceof File) || !(after instanceof File)) {
      return NextResponse.json(
        { error: "Missing image files. Use the camera capture flow." },
        { status: 400 }
      );
    }
    if (before.size > MAX_FILE_BYTES || after.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Images are too large. Try capturing again." },
        { status: 400 }
      );
    }

    const parsed = submitFormSchema.safeParse({
      employee_id: form.get("employee_id"),
      employee_name: form.get("employee_name"),
      work_date: form.get("work_date"),
      rack_count: form.get("rack_count"),
      work_type: form.get("work_type") || null,
      before_captured_at: form.get("before_captured_at"),
      after_captured_at: form.get("after_captured_at"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const id = crypto.randomUUID();
    const basePath = `${parsed.data.employee_id}/${id}`;

    const beforePath = `${basePath}/before.jpg`;
    const afterPath = `${basePath}/after.jpg`;

    const beforeBuf = Buffer.from(await before.arrayBuffer());
    const afterBuf = Buffer.from(await after.arrayBuffer());

    const upBefore = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(beforePath, beforeBuf, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (upBefore.error) {
      console.error(upBefore.error);
      return NextResponse.json(
        { error: "Could not store before image." },
        { status: 500 }
      );
    }

    const upAfter = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(afterPath, afterBuf, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (upAfter.error) {
      console.error(upAfter.error);
      await supabase.storage.from(STORAGE_BUCKET).remove([beforePath]);
      return NextResponse.json(
        { error: "Could not store after image." },
        { status: 500 }
      );
    }

    const submittedAt =
      typeof form.get("submitted_at") === "string"
        ? (form.get("submitted_at") as string)
        : new Date().toISOString();

    const { data: inserted, error: insertError } = await supabase
      .from("submissions")
      .insert({
        id,
        employee_id: parsed.data.employee_id,
        employee_name: parsed.data.employee_name,
        work_date: parsed.data.work_date,
        rack_count: parsed.data.rack_count,
        work_type: parsed.data.work_type || null,
        before_image_path: beforePath,
        after_image_path: afterPath,
        before_captured_at: parsed.data.before_captured_at,
        after_captured_at: parsed.data.after_captured_at,
        submitted_at: submittedAt,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(insertError);
      await supabase.storage.from(STORAGE_BUCKET).remove([beforePath, afterPath]);
      return NextResponse.json(
        { error: "Could not save submission." },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: inserted.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
