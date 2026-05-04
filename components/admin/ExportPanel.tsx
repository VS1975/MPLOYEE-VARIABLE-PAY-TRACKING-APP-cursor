"use client";

import { useState } from "react";

type Props = {
  employeeId: string;
  from: string;
  to: string;
};

export function ExportPanel({ employeeId, from, to }: Props) {
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = async (kind: "csv" | "pdf") => {
    setError(null);
    setBusy(kind);
    try {
      const qs = new URLSearchParams();
      if (employeeId) qs.set("employee_id", employeeId);
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const res = await fetch(`/api/admin/reports/${kind}?${qs.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Download failed");
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] || `report.${kind}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Reports</h3>
          <p className="text-xs text-slate-600">
            Uses the same filters as the table (employee + date range).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => download("csv")}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy === "csv" ? "Preparing…" : "Download CSV"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => download("pdf")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === "pdf" ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-3 text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}
