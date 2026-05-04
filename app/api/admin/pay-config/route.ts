import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  normal_pay_per_rack: z.coerce.number().min(0).max(1_000_000),
  bonus_threshold_racks: z.coerce.number().int().min(0).max(100000),
  bonus_pay_per_rack: z.coerce.number().min(0).max(1_000_000),
});

export async function PATCH(req: Request) {
  const supabase = await createClient();
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

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase
    .from("pay_config")
    .update({
      normal_pay_per_rack: parsed.data.normal_pay_per_rack,
      bonus_threshold_racks: parsed.data.bonus_threshold_racks,
      bonus_pay_per_rack: parsed.data.bonus_pay_per_rack,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
