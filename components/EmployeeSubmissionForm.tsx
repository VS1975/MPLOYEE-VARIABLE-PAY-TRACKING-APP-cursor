"use client";

import { CameraCapture } from "@/components/CameraCapture";
import { useState } from "react";

function todayISODate() {
  // Create a date object for the current moment
  const d = new Date();
  
  // Convert to IST by adding 5.5 hours (5 * 60 + 30 minutes)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);

  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EmployeeSubmissionForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [workDate, setWorkDate] = useState(todayISODate);
  const [rackCount, setRackCount] = useState<number | "">("");
  const [workType, setWorkType] = useState("");

  const [before, setBefore] = useState<{
    blob: Blob;
    capturedAt: string;
    url: string;
  } | null>(null);
  const [after, setAfter] = useState<{
    blob: Blob;
    capturedAt: string;
    url: string;
  } | null>(null);

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  const reset = () => {
    setEmployeeId("");
    setEmployeeName("");
    setWorkDate(todayISODate());
    setRackCount("");
    setWorkType("");
    if (before?.url) URL.revokeObjectURL(before.url);
    if (after?.url) URL.revokeObjectURL(after.url);
    setBefore(null);
    setAfter(null);
    setStatus("idle");
    setMessage(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!before || !after) {
      setStatus("error");
      setMessage("Please capture both before and after photos using the camera.");
      return;
    }
    if (rackCount === "" || Number.isNaN(Number(rackCount))) {
      setStatus("error");
      setMessage("Enter a valid rack count.");
      return;
    }

    setStatus("submitting");
    try {
      const fd = new FormData();
      fd.set("employee_id", employeeId.trim());
      fd.set("employee_name", employeeName.trim());
      fd.set("work_date", workDate);
      fd.set("rack_count", String(rackCount));
      fd.set("work_type", workType.trim());
      fd.set("before_captured_at", before.capturedAt);
      fd.set("after_captured_at", after.capturedAt);
      // Replace this line:
// fd.set("submitted_at", new Date().toISOString());

// With this for a readable IST string:
      fd.set("submitted_at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      fd.set("before_image", before.blob, "before.jpg");
      fd.set("after_image", after.blob, "after.jpg");

      const res = await fetch("/api/submit", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || "Submission failed");
      }
      setStatus("success");
      setMessage(
        `Submission saved. Reference: ${json.id?.slice(0, 8) ?? "ok"}…`
      );
      if (before?.url) URL.revokeObjectURL(before.url);
      if (after?.url) URL.revokeObjectURL(after.url);
      setBefore(null);
      setAfter(null);
      setEmployeeId("");
      setEmployeeName("");
      setWorkDate(todayISODate());
      setRackCount("");
      setWorkType("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex max-w-lg flex-col gap-5 px-4 pb-16 pt-6"
    >
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Daily work log
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Submit your shift</h1>
        <p className="text-sm text-slate-600">
          Use the camera for verification photos. Timestamps are embedded
          automatically.
        </p>
      </header>

      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-medium text-slate-800">
          Employee ID
          <input
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none ring-blue-500/30 focus:ring-4"
            autoComplete="off"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-800">
          Name
          <input
            required
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none ring-blue-500/30 focus:ring-4"
            autoComplete="name"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-800">
          Date
          <input
            type="date"
            required
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none ring-blue-500/30 focus:ring-4"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-800">
          Rack count
          <input
            type="number"
            inputMode="numeric"
            min={0}
            required
            value={rackCount}
            onChange={(e) =>
              setRackCount(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none ring-blue-500/30 focus:ring-4"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-800">
          Work type <span className="font-normal text-slate-500">(optional)</span>
          <input
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            placeholder="e.g. Restock, pick, audit"
            className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none ring-blue-500/30 focus:ring-4"
          />
        </label>
      </div>

      <CameraCapture
        label="Before photo"
        previewUrl={before?.url ?? null}
        onClear={() => {
          if (before?.url) URL.revokeObjectURL(before.url);
          setBefore(null);
        }}
        onCaptured={({ blob, capturedAt }) => {
          if (before?.url) URL.revokeObjectURL(before.url);
          const url = URL.createObjectURL(blob);
          setBefore({ blob, capturedAt, url });
        }}
      />

      <CameraCapture
        label="After photo"
        previewUrl={after?.url ?? null}
        onClear={() => {
          if (after?.url) URL.revokeObjectURL(after.url);
          setAfter(null);
        }}
        onCaptured={({ blob, capturedAt }) => {
          if (after?.url) URL.revokeObjectURL(after.url);
          const url = URL.createObjectURL(blob);
          setAfter({ blob, capturedAt, url });
        }}
      />

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <div className="font-semibold text-slate-800">Timestamps</div>
        <p className="mt-2">
          Each photo stores a capture time on the image. The database stores{" "}
          <span className="font-semibold text-slate-800">submitted_at</span> when
          you tap Submit (server clock).
        </p>
      </div>

      {message && (
        <div
          className={
            status === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900"
              : "rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-900"
          }
        >
          {message}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="min-h-[52px] flex-1 rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Submitting…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="min-h-[52px] rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
        >
          Clear form
        </button>
      </div>
    </form>
  );
}
