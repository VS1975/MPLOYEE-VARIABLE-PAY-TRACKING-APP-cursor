type DayPoint = { date: string; racks: number; entries: number };

export function DailyTrend({ points }: { points: DayPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.racks));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Daily rack volume</h3>
        <p className="text-xs text-slate-500">Last {points.length} days with data</p>
      </div>
      {points.length === 0 ? (
        <p className="text-sm text-slate-600">No submissions in this window yet.</p>
      ) : (
        <div className="flex items-end gap-2 overflow-x-auto pb-2">
          {points.map((p) => (
            <div key={p.date} className="flex w-10 flex-col items-center gap-1">
              <div
                className="w-full rounded-md bg-blue-500/90"
                style={{ height: `${Math.max(8, (p.racks / max) * 120)}px` }}
                title={`${p.date}: ${p.racks} racks (${p.entries} entries)`}
              />
              <span className="rotate-45 text-[9px] text-slate-500">{p.date.slice(5)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
