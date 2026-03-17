'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LossReasonReportClientProps {
  from: string;
  to: string;
  includeDrafts: boolean;
  onlyHighValue: boolean;
}

const lossReasons = [
  { reason: 'Price', count: 24, percentage: 48, trend: 'up', trendValue: '+12%' },
  { reason: 'Service Quality', count: 12, percentage: 24, trend: 'down', trendValue: '-5%' },
  { reason: 'Transit Time', count: 8, percentage: 16, trend: 'up', trendValue: '+3%' },
  { reason: 'Customer Service', count: 4, percentage: 8, trend: 'stable', trendValue: '0%' },
  { reason: 'Other', count: 2, percentage: 4, trend: 'down', trendValue: '-2%' },
];

const lostQuotes = [
  { id: 'Q-1003', customer: 'Euro Import', value: 3150, currency: 'EUR', reason: 'Price', date: '2024-03-12' },
  { id: 'Q-1007', customer: 'Global Freight', value: 8900, currency: 'USD', reason: 'Service Quality', date: '2024-03-05' },
  { id: 'Q-1012', customer: 'Asian Trade Co', value: 12400, currency: 'USD', reason: 'Price', date: '2024-02-28' },
  { id: 'Q-1015', customer: 'Mediterranean Lines', value: 5600, currency: 'EUR', reason: 'Transit Time', date: '2024-02-20' },
];

export default function LossReasonReportClient({ from, to }: LossReasonReportClientProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = () => {
    if (from && to) {
      return `${formatDate(from)} - ${formatDate(to)}`;
    }
    return 'All Time';
  };

  const totalLost = useMemo(() => lossReasons.reduce((sum, r) => sum + r.count, 0), []);
  const totalLostValue = useMemo(() => lostQuotes.reduce((sum, q) => sum + q.value, 0), []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Loss Reason Analysis Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date Range: ${formatDateRange()}`, 14, 30);

    autoTable(doc, {
      head: [['Reason', 'Count', 'Percentage']],
      body: lossReasons.map((r) => [r.reason, String(r.count), `${r.percentage}%`]),
      startY: 40,
    });

    doc.save(`loss-reason-analysis-${from}-${to}.pdf`);
  };

  const exportToExcel = () => {
    const reasonsSheet = XLSX.utils.json_to_sheet(lossReasons);
    const quotesSheet = XLSX.utils.json_to_sheet(lostQuotes);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, reasonsSheet, 'Reasons');
    XLSX.utils.book_append_sheet(workbook, quotesSheet, 'Lost Quotes');
    XLSX.writeFile(workbook, `loss-reason-analysis-${from}-${to}.xlsx`);
  };

  const getTrendIcon = (trend: string) => {
    const icons: Record<string, string> = {
      up: 'trending_up',
      down: 'trending_down',
      stable: 'trending_flat',
    };
    return icons[trend] || 'trending_flat';
  };

  const getTrendColor = (trend: string) => {
    const colors: Record<string, string> = {
      up: 'text-red-600 dark:text-red-400',
      down: 'text-green-600 dark:text-green-400',
      stable: 'text-slate-500 dark:text-slate-400',
    };
    return colors[trend] || 'text-slate-500';
  };

  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-10 py-3 shrink-0">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-6 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">sailing</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">ShipFlow CRM</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="flex items-center gap-9">
            <Link className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" href="/dashboard">Dashboard</Link>
            <Link className="text-sm font-bold leading-normal text-primary border-b-2 border-primary pb-1" href="/reports">Reports</Link>
            <Link className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Quotes</Link>
            <Link className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Customers</Link>
            <Link className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Settings</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 transition-colors">
              <span className="truncate">Create Quote</span>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-8 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto overflow-hidden">
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">Loss Reason Analysis Report</h1>
            <p className="text-sm font-normal text-slate-500 dark:text-slate-400">Date Range: {formatDateRange()}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportToPDF} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm font-bold shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
              <span>Export PDF</span>
            </button>
            <button onClick={exportToExcel} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm font-bold shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-lg">table_chart</span>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loss Reasons Breakdown</h3>
            </div>
            <div className="p-6">
              {lossReasons.map((r) => (
                <div key={r.reason} className="mb-6 last:mb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">{r.reason}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs flex items-center gap-1 ${getTrendColor(r.trend)}`}>
                        <span className="material-symbols-outlined text-sm">{getTrendIcon(r.trend)}</span>
                        {r.trendValue}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{r.count}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">({r.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${r.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Lost Quotes</h3>
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {lostQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{q.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{q.customer}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{q.value.toLocaleString()} {q.currency}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        {q.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Loss Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Lost Quotes</p>
              <span className="text-4xl font-bold text-red-600 dark:text-red-400">{totalLost}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Lost Value</p>
              <span className="text-4xl font-bold text-red-600 dark:text-red-400">${totalLostValue.toLocaleString()}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Top Loss Reason</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">Price</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">48% of losses</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
