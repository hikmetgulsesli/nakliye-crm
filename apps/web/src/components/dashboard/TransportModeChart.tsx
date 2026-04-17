import { cn } from '@/utils/cn';

interface TransportModeData {
  mode: string;
  percentage: number;
  color: string;
}

interface TransportModeChartProps {
  data: TransportModeData[];
  className?: string;
}

const COLOR_MAP: Record<string, { stroke: string; bg: string; text: string }> = {
  blue: { stroke: 'stroke-blue-500', bg: 'bg-blue-500', text: 'text-blue-600' },
  emerald: { stroke: 'stroke-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-600' },
  amber: { stroke: 'stroke-amber-500', bg: 'bg-amber-500', text: 'text-amber-600' },
  purple: { stroke: 'stroke-purple-500', bg: 'bg-purple-500', text: 'text-purple-600' },
  red: { stroke: 'stroke-red-500', bg: 'bg-red-500', text: 'text-red-600' },
  slate: { stroke: 'stroke-slate-400', bg: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300' },
};

export function TransportModeChart({ data, className }: TransportModeChartProps) {
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  const center = 90;

  // Calculate stroke-dasharray offsets for each segment
  let accumulatedOffset = 0;
  const segments = data.map((item) => {
    const dashLength = (item.percentage / 100) * circumference;
    const gapLength = circumference - dashLength;
    const offset = accumulatedOffset;
    accumulatedOffset += dashLength;
    return { ...item, dashLength, gapLength, offset };
  });

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6',
        className,
      )}
    >
      <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 mb-6">
        Tasima Modu Dagilimi
      </h3>

      <div className="flex items-center gap-8">
        {/* SVG Donut Chart */}
        <div className="relative shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180">
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {/* Data segments */}
            {segments.map((seg, i) => {
              const colors = COLOR_MAP[seg.color] || COLOR_MAP.blue;
              return (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  className={colors.stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.dashLength} ${seg.gapLength}`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              );
            })}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
              {data.reduce((acc, d) => acc + d.percentage, 0)}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Toplam</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1">
          {data.map((item) => {
            const colors = COLOR_MAP[item.color] || COLOR_MAP.blue;
            return (
              <div key={item.mode} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('size-3 rounded-full', colors.bg)} />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.mode}</span>
                </div>
                <span className={cn('text-sm font-bold', colors.text)}>
                  %{item.percentage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
