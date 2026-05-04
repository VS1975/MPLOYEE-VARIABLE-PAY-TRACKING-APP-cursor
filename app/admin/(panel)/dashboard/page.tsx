import { DailyTrend } from "@/components/admin/DailyTrend";
import { ExportPanel } from "@/components/admin/ExportPanel";
import { FilterToolbar } from "@/components/admin/FilterToolbar";
import { SubmissionCard } from "@/components/admin/SubmissionCard";
import { getAdminUser } from "@/lib/auth-admin";
import { computePayForRacks } from "@/lib/pay";
import { createClient } from "@/lib/supabase/server";
import type { PayConfig, SubmissionRow } from "@/lib/types";
import { redirect } from "next/navigation";

function firstString(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const employeeId = firstString(sp.employee_id);
  const from = firstString(sp.from);
  const to = firstString(sp.to);
  const performance = (firstString(sp.performance) || "all") as
    | "all"
    | "bonus"
    | "standard";

  const supabase = await createClient();

  const { data: payRow, error: payError } = await supabase
    .from("pay_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (payError || !payRow) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Pay configuration is missing. Run the SQL in <code>supabase/schema.sql</code>{" "}
        and ensure row <code>id = 1</code> exists.
      </div>
    );
  }

  const payConfig = payRow as PayConfig;
  const threshold = payConfig.bonus_threshold_racks;

  let query = supabase
    .from("submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(800);

  if (employeeId) query = query.eq("employee_id", employeeId);
  if (from) query = query.gte("work_date", from);
  if (to) query = query.lte("work_date", to);
  if (performance === "bonus") query = query.gte("rack_count", threshold);
  if (performance === "standard") query = query.lt("rack_count", threshold);

  const { data: rows, error } = await query;
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Could not load submissions. Check RLS policies and admin flag on your profile.
      </div>
    );
  }

  const submissions = (rows ?? []) as SubmissionRow[];

  const totalsByDay = new Map<string, { racks: number; entries: number }>();
  for (const s of submissions) {
    const cur = totalsByDay.get(s.work_date) ?? { racks: 0, entries: 0 };
    cur.racks += s.rack_count;
    cur.entries += 1;
    totalsByDay.set(s.work_date, cur);
  }
  const trendPoints = Array.from(totalsByDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-14)
    .map(([date, v]) => ({ date, racks: v.racks, entries: v.entries }));

  const totalRacks = submissions.reduce((sum, s) => sum + s.rack_count, 0);
  const totalPay = submissions.reduce((sum, s) => {
    const { amount } = computePayForRacks(s.rack_count, payConfig);
    return sum + amount;
  }, 0);

  const grouped = new Map<string, SubmissionRow[]>();
  for (const s of submissions) {
    const list = grouped.get(s.employee_id) ?? [];
    list.push(s);
    grouped.set(s.employee_id, list);
  }

  const sortedGroups = Array.from(grouped.entries()).sort((a, b) =>
    a[1][0].employee_name.localeCompare(b[1][0].employee_name)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations dashboard</h1>
          <p className="text-sm text-slate-600">
            Grouped by employee with live previews, pay preview, and daily trends.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <p className="text-xs text-slate-500">Entries</p>
            <p className="text-xl font-semibold">{submissions.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <p className="text-xs text-slate-500">Racks (filtered)</p>
            <p className="text-xl font-semibold">{totalRacks}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <p className="text-xs text-slate-500">Variable pay (filtered)</p>
            <p className="text-xl font-semibold text-emerald-700">
              ₹{totalPay.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <FilterToolbar
        employeeId={employeeId}
        from={from}
        to={to}
        performance={performance}
      />

      <ExportPanel employeeId={employeeId} from={from} to={to} />

      <DailyTrend points={trendPoints} />

      <div className="space-y-8">
        {sortedGroups.map(([empId, list]) => (
          <section key={empId} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {list[0]?.employee_name}{" "}
                <span className="text-sm font-normal text-slate-500">({empId})</span>
              </h2>
              <p className="text-sm text-slate-600">
                {list.length} entr{list.length === 1 ? "y" : "ies"} ·{" "}
                {list.reduce((s, r) => s + r.rack_count, 0)} racks
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {list.map((row) => {
                const { amount, label } = computePayForRacks(row.rack_count, payConfig);
                return (
                  <SubmissionCard
                    key={row.id}
                    row={row}
                    payAmount={amount}
                    payLabel={label}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No rows match these filters yet.
        </div>
      )}
    </div>
  );
}
