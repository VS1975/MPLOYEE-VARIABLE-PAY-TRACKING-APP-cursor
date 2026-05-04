import { createClient } from "@/lib/supabase/server";
import type { PayConfig, SubmissionRow } from "@/lib/types";

export async function loadReportDataset(filters: {
  employeeId?: string;
  from?: string;
  to?: string;
}): Promise<
  | { ok: true; rows: SubmissionRow[]; payConfig: PayConfig }
  | { ok: false; status: number; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, message: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false, status: 403, message: "Forbidden" };

  const { data: payRow, error: payError } = await supabase
    .from("pay_config")
    .select("*")
    .eq("id", 1)
    .single();
  if (payError || !payRow) {
    return { ok: false, status: 500, message: "Pay configuration missing" };
  }

  let query = supabase
    .from("submissions")
    .select("*")
    .order("work_date", { ascending: true })
    .limit(2000);

  if (filters.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters.from) query = query.gte("work_date", filters.from);
  if (filters.to) query = query.lte("work_date", filters.to);

  const { data: rows, error } = await query;
  if (error) {
    return { ok: false, status: 500, message: "Could not load submissions" };
  }

  return {
    ok: true,
    rows: (rows ?? []) as SubmissionRow[],
    payConfig: payRow as PayConfig,
  };
}
