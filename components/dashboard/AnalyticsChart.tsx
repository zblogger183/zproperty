export interface AnalyticsPoint {
  label: string;
  value: number;
}

export function AnalyticsChart({ points }: { points: AnalyticsPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className="flex h-40 items-end gap-2 rounded-lg border border-secondary p-4">
      {points.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-primary"
            style={{ height: `${(point.value / max) * 100}%` }}
          />
          <span className="text-xs text-text">{point.label}</span>
        </div>
      ))}
    </div>
  );
}
