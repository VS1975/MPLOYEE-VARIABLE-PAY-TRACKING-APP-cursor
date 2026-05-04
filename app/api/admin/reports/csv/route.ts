import { STORAGE_BUCKET } from "@/lib/constants";
import { computePayForRacks } from "@/lib/pay";
import { loadReportDataset } from "@/lib/report-data";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const dataset = await loadReportDataset({ employeeId, from, to });
  if (!dataset.ok) {
    return NextResponse.json(
      { error: dataset.message },
      { status: dataset.status }
    );
  }

  const supabase = await createClient();
  const header = [
    "submission_id",
    "employee_id",
    "employee_name",
    "work_date",
    "rack_count",
    "work_type",
    "pay_amount",
    "pay_rule",
    "submitted_at",
    "before_captured_at",
    "after_captured_at",
    "before_image_path",
    "after_image_path",
    "before_signed_url",
    "after_signed_url",
  ];

  const lines: string[] = [header.join(",")];

  for (const row of dataset.rows) {
    const { amount, label } = computePayForRacks(row.rack_count, dataset.payConfig);
    const beforeUrl =
      (
        await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(row.before_image_path, 60 * 60 * 24)
      ).data?.signedUrl ?? "";
    const afterUrl =
      (
        await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(row.after_image_path, 60 * 60 * 24)
      ).data?.signedUrl ?? "";

    lines.push(
      [
        row.id,
        row.employee_id,
        row.employee_name,
        row.work_date,
        String(row.rack_count),
        row.work_type ?? "",
        amount.toFixed(2),
        label,
        row.submitted_at,
        row.before_captured_at,
        row.after_captured_at,
        row.before_image_path,
        row.after_image_path,
        beforeUrl,
        afterUrl,
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }

  const body = lines.join("\n");
  const filename = `mployee-report-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
