import { computePayForRacks } from "@/lib/pay";
import { loadReportDataset } from "@/lib/report-data";
import { NextResponse } from "next/server";

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

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("Mployee — variable pay report", 14, 16);
  doc.setFontSize(10);
  doc.text(
    `Generated ${new Date().toISOString()} · Filters: employee=${
      employeeId ?? "all"
    } · from=${from ?? "any"} · to=${to ?? "any"}`,
    14,
    24
  );

  const body = dataset.rows.map((row) => {
    const { amount, label } = computePayForRacks(row.rack_count, dataset.payConfig);
    return [
      row.work_date,
      row.employee_id,
      row.employee_name,
      String(row.rack_count),
      amount.toFixed(2),
      label.slice(0, 48),
      row.before_image_path,
      row.after_image_path,
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Date",
        "Emp ID",
        "Name",
        "Racks",
        "Pay",
        "Rule",
        "Before path",
        "After path",
      ],
    ],
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  const filename = `mployee-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  const arrayBuffer = doc.output("arraybuffer");

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
