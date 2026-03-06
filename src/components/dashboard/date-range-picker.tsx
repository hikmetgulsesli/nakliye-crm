'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  className?: string;
}

const PRESETS = [
  { label: 'Son 7 Gün', days: 7 },
  { label: 'Son 30 Gün', days: 30 },
  { label: 'Son 90 Gün', days: 90 },
  { label: 'Bu Yıl', days: 365 },
];

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
}: DateRangePickerProps) {
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  const handleApply = () => {
    onChange(localFrom, localTo);
  };

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const fromStr = start.toISOString().split('T')[0];
    const toStr = end.toISOString().split('T')[0];

    setLocalFrom(fromStr);
    setLocalTo(toStr);
    onChange(fromStr, toStr);
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-4 shadow-sm', className)}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Tarih Aralığı:</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <span className="text-slate-500">-</span>
          <input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"
          >
            Uygula
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {PRESETS.map((preset) => (
            <button
              key={preset.days}
              onClick={() => handlePresetClick(preset.days)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
