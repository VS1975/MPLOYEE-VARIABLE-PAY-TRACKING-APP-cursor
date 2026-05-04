import { computePayForRacks } from "@/lib/pay";
import { loadReportDataset } from "@/lib/report-data";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

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

  // Build Excel data
  const data = dataset.rows.map((row) => {
    const { amount, label } = computePayForRacks(row.rack_count, dataset.payConfig);
    return {
      "Submission ID": row.id,
      "Employee ID": row.employee_id,
      "Employee Name": row.employee_name,
      "Work Date": row.work_date,
      "Rack Count": row.rack_count,
      "Rack Name": row.work_type ?? "",
      "Pay Amount (₹)": amount,
      "Pay Rule": label,
      "Submitted At": row.submitted_at,
    };
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 36 }, // Submission ID
    { wch: 15 }, // Employee ID
    { wch: 20 }, // Employee Name
    { wch: 12 }, // Work Date
    { wch: 12 }, // Rack Count
    { wch: 15 }, // Rack Name
    { wch: 15 }, // Pay Amount
    { wch: 30 }, // Pay Rule
    { wch: 25 }, // Submitted At
  ];
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Report");

  // Generate buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `mployee-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
