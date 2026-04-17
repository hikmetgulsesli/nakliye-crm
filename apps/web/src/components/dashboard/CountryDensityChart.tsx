import { useState } from 'react';
import { cn } from '@/utils/cn';

interface CountryData {
  country: string;
  flag: string;
  percentage: number;
  count: number;
}

interface CountryDensityChartProps {
  originCountries: CountryData[];
  destinationCountries: CountryData[];
  className?: string;
}

type Tab = 'origin' | 'destination';

export function CountryDensityChart({
  originCountries,
  destinationCountries,
  className,
}: CountryDensityChartProps) {
  const [activeTab, setActiveTab] = useState<Tab>('origin');

  const countries = activeTab === 'origin' ? originCountries : destinationCountries;
  const maxPercentage = Math.max(...countries.map((c) => c.percentage), 1);

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">
          Ulke Bazli Yogunluk
        </h3>

        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('origin')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'origin'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200',
            )}
          >
            Cikis Ulkeleri
          </button>
          <button
            onClick={() => setActiveTab('destination')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'destination'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200',
            )}
          >
            Varis Ulkeleri
          </button>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="px-6 pb-6 space-y-4">
        {countries.map((item) => (
          <div key={item.country} className="flex items-center gap-4">
            {/* Country label */}
            <div className="flex items-center gap-2 w-28 shrink-0">
              <span className="text-xl leading-none">{item.flag}</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {item.country}
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
              <div
                className="h-full bg-primary/80 rounded-lg transition-all duration-500"
                style={{ width: `${(item.percentage / maxPercentage) * 100}%` }}
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                {item.count}
              </span>
            </div>

            {/* Percentage */}
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 w-12 text-right">
              %{item.percentage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
