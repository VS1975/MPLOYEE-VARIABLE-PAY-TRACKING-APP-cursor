"use client";

import type { PayConfig } from "@/lib/types";
import { useState } from "react";

type Props = { initial: PayConfig };

export function PaySettingsForm({ initial }: Props) {
  const [normal, setNormal] = useState(String(initial.normal_pay_per_rack));
  const [threshold, setThreshold] = useState(String(initial.bonus_threshold_racks));
  const [bonus, setBonus] = useState(String(initial.bonus_pay_per_rack));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pay-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          normal_pay_per_rack: Number(normal),
          bonus_threshold_racks: Number(threshold),
          bonus_pay_per_rack: Number(bonus),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not save");
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h1 className="text-xl font-bold text-slate-900">Variable pay rules</h1>
        <p className="mt-1 text-sm text-slate-600">
          When racks for a submission are at or above the threshold, the bonus
          per-rack rate applies to that entire submission&apos;s rack count.
        </p>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-800">
        Standard pay per rack (INR ₹)
        <input
          required
          type="number"
          step="0.01"
          min={0}
          value={normal}
          onChange={(e) => setNormal(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-800">
        Bonus threshold (racks)
        <input
          required
          type="number"
          step="1"
          min={0}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-800">
        Bonus pay per rack (INR ₹)
        <input
          required
          type="number"
          step="0.01"
          min={0}
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2"
        />
      </label>
      {message && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
