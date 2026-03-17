'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReportsClientProps {
  userRole: string;
}

const reportTypes = [
  {
    id: 'periodic',
    title: 'Periodic Quotation Report',
    description: 'Analyze temporal trends in quotation volumes and success rates across different time periods.',
    icon: 'date_range',
  },
  {
    id: 'personnel',
    title: 'Personnel Performance Report',
    description: 'Track sales rep metrics, conversion rates, quoting volume, and overall team performance.',
    icon: 'group',
  },
  {
    id: 'won-lost',
    title: 'Won/Lost Analysis',
    description: 'Detailed breakdown of conversion rates, comparing successful shipments against lost opportunities.',
    icon: 'bar_chart',
  },
  {
    id: 'country-mode',
    title: 'Country/Mode Volume',
    description: 'Geographical and logistics data analyzing shipping volumes by destination country and transport mode.',
    icon: 'public',
  },
  {
    id: 'loss-reason',
    title: 'Loss Reason Analysis',
    description: 'Categorized breakdown for understanding missed opportunities to improve future quoting strategies.',
    icon: 'pie_chart',
  },
];

export default function ReportsClient({ userRole }: ReportsClientProps) {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [onlyHighValue, setOnlyHighValue] = useState(false);

  const handleQuickSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateTo(to.toISOString().split('T')[0]);
    setDateFrom(from.toISOString().split('T')[0]);
  };

  const handleGenerateReport = (reportType: string) => {
    const params = new URLSearchParams({
      from: dateFrom,
      to: dateTo,
      includeDrafts: includeDrafts.toString(),
      onlyHighValue: onlyHighValue.toString(),
    });
    router.push(`/reports/${reportType}?${params.toString()}`);
  };

  return (
    <>
      {/* Sidebar */}
      <aside className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
        <div>
          <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Date Range</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">From</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  calendar_today
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">To</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  calendar_today
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Quick Select */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">Quick Select</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickSelect(7)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handleQuickSelect(30)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => handleQuickSelect(90)}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg shadow-sm"
                >
                  This Quarter
                </button>
                <button
                  onClick={() => {
                    const to = new Date();
                    const from = new Date(to.getFullYear(), 0, 1);
                    setDateTo(to.toISOString().split('T')[0]);
                    setDateFrom(from.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
                >
                  YTD
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">Filters</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDrafts}
                    onChange={(e) => setIncludeDrafts(e.target.checked)}
                    className="rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Include Drafts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyHighValue}
                    onChange={(e) => setOnlyHighValue(e.target.checked)}
                    className="rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Only High Value (&gt; $10k)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-6 md:p-10 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-[32px] font-bold leading-tight mb-2 text-slate-900 dark:text-white">
              Reports
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
              Select and generate administrative reports for your shipping operations. Data is generated based on the date range selected in the sidebar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">{report.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-tight mb-1 text-slate-900 dark:text-white">
                      {report.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    className="flex items-center gap-2 h-9 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Generate</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
