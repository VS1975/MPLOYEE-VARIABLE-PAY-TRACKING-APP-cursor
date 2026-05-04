type Props = {
  employeeId: string;
  from: string;
  to: string;
  performance: "all" | "bonus" | "standard";
};

export function FilterToolbar({ employeeId, from, to, performance }: Props) {
  return (
    <form
      method="get"
      className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
    >
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Employee ID
        <input
          name="employee_id"
          defaultValue={employeeId}
          placeholder="Any"
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        From
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        To
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Performance
        <select
          name="performance"
          defaultValue={performance}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="bonus">Bonus tier (racks ≥ threshold)</option>
          <option value="standard">Below bonus tier</option>
        </select>
      </label>
      <div className="md:col-span-4 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Apply filters
        </button>
        <a
          href="/admin/dashboard"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Reset
        </a>
      </div>
    </form>
  );
}
