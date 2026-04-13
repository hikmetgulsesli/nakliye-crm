import { cn } from '@/utils/cn';

interface LossReasonData {
  reason: string;
  percentage: number;
  count: number;
}

interface LossReasonsChartProps {
  data: LossReasonData[];
  className?: string;
}

const BAR_COLORS = [
  'bg-red-500',
  'bg-amber-500',
  'bg-orange-400',
  'bg-slate-400',
];

export function LossReasonsChart({ data, className }: LossReasonsChartProps) {
  const maxPercentage = Math.max(...data.map((d) => d.percentage), 1);

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm p-6',
        className,
      )}
    >
      <h3 className="font-display font-bold text-lg text-slate-900 mb-6">
        Kaybedilme Nedenleri
      </h3>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.reason}>
            {/* Label row */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700 uppercase tracking-wider">
                {item.reason}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{item.count} teklif</span>
                <span className="text-sm font-bold text-slate-900">%{item.percentage}</span>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  BAR_COLORS[index % BAR_COLORS.length],
                )}
                style={{ width: `${(item.percentage / maxPercentage) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
