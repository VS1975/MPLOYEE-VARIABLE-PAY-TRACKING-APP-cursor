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

  // Group rows by date
  const groupedByDate = new Map<string, typeof dataset.rows>();
  for (const row of dataset.rows) {
    const list = groupedByDate.get(row.work_date) ?? [];
    list.push(row);
    groupedByDate.set(row.work_date, list);
  }

  // Sort dates
  const sortedDates = Array.from(groupedByDate.keys()).sort();

  let currentY = 30;

  for (const date of sortedDates) {
    const rows = groupedByDate.get(date)!;
    
    // Collect unique rack names for this date
    const rackNames = rows
      .map(r => r.work_type)
      .filter((v): v is string => Boolean(v))
      .filter((v, i, a) => a.indexOf(v) === i);
    const rackNamesDisplay = rackNames.length > 0 ? rackNames.join(", ") : "-";

    // Calculate totals for this date
    const totalRacks = rows.reduce((sum, r) => sum + r.rack_count, 0);
    const totalPay = rows.reduce((sum, r) => {
      const { amount } = computePayForRacks(r.rack_count, dataset.payConfig);
      return sum + amount;
    }, 0);

    const body = rows.map((row) => {
      const { amount, label } = computePayForRacks(row.rack_count, dataset.payConfig);
      return [
        row.employee_id,
        row.employee_name,
        String(row.rack_count),
        row.work_type ?? "-",
        amount.toFixed(2),
        label.slice(0, 48),
      ];
    });

    // Date header with rack names
    doc.setFontSize(11);
    doc.text(`${date} — Rack names: ${rackNamesDisplay}`, 14, currentY);
    doc.setFontSize(9);
    doc.text(`Total: ${totalRacks} racks · ₹${totalPay.toFixed(2)}`, 14, currentY + 5);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Emp ID", "Name", "Racks", "Rack name", "Pay", "Rule"]],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
      margin: { top: currentY },
    });

    currentY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? (currentY + 40);
    currentY += 10;

    // Add new page if running out of space
    if (currentY > 180 && sortedDates.indexOf(date) < sortedDates.length - 1) {
      doc.addPage();
      currentY = 20;
    }
  }

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
