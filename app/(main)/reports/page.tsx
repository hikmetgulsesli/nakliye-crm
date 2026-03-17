'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '2026-03-01',
    end: '2026-03-31',
  });

  const reports = [
    {
      id: 'periodic',
      title: 'Periodic Quotation Report',
      description: 'Comprehensive report of all quotations within a specific time period including win/loss analysis.',
      icon: 'request_quote',
    },
    {
      id: 'performance',
      title: 'Personnel Performance Report',
      description: 'Track individual sales representative performance with metrics on quotes, wins, and activities.',
      icon: 'group',
    },
    {
      id: 'won-lost',
      title: 'Won / Lost Analysis',
      description: 'Detailed breakdown of won and lost quotations with reasons and trends.',
      icon: 'bar_chart',
    },
    {
      id: 'geography',
      title: 'Geographic Volume Report',
      description: 'Analyze shipping volumes by origin and destination countries and routes.',
      icon: 'public',
    },
    {
      id: 'loss-reasons',
      title: 'Loss Reason Analysis',
      description: 'Understand why quotations are lost to competitors and identify improvement areas.',
      icon: 'pie_chart',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate and export detailed reports for business analysis.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Date Range */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Date Range</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Quick Select</h4>
                <div className="flex flex-wrap gap-2">
                  {['Last 7 Days', 'Last 30 Days', 'This Quarter', 'YTD'].map((period) => (
                    <button
                      key={period}
                      className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Filters</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Include details</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Show charts</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content - Report Cards */}
          <section className="flex-1">
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row gap-4 hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl">{report.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {report.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      {report.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/reports/${report.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
                      >
                        Generate
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
