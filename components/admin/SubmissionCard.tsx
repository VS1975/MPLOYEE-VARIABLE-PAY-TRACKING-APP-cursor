"use client";

import { SignedImage } from "@/components/admin/SignedImage";
import type { SubmissionRow } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SubmissionCard({
  row,
  payAmount,
  payLabel,
}: {
  row: SubmissionRow;
  payAmount: number;
  payLabel: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/submissions/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to delete");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {row.work_date} · {row.employee_id}
          </p>
          <p className="text-lg font-semibold text-slate-900">{row.employee_name}</p>
          {row.work_type && (
            <p className="text-sm text-slate-600">Rack name: {row.work_type}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{row.rack_count}</p>
          <p className="text-xs text-slate-500">racks</p>
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            ₹{payAmount.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500">{payLabel}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">Before</p>
          <SignedImage path={row.before_image_path} alt="Before" />
          <p className="mt-1 text-[11px] text-slate-500">
            Device: {new Date(row.before_captured_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">After</p>
          <SignedImage path={row.after_image_path} alt="After" />
          <p className="mt-1 text-[11px] text-slate-500">
            Device: {new Date(row.after_captured_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          Submitted (server): {new Date(row.submitted_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
        </p>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}
