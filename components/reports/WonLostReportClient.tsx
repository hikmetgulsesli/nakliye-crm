'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WonLostReportClientProps {
  from: string;
  to: string;
  includeDrafts: boolean;
  onlyHighValue: boolean;
}

const wonQuotes = [
  { id: 'Q-1001', customer: 'Acme Corp', value: 12500, currency: 'USD', mode: 'AIR', wonBy: 'Elif Yılmaz', date: '2024-03-15' },
  { id: 'Q-1004', customer: 'Tech Logistics', value: 15800, currency: 'USD', mode: 'AIR', wonBy: 'Ayşe Demir', date: '2024-03-10' },
  { id: 'Q-1005', customer: 'Fast Track', value: 6400, currency: 'USD', mode: 'SEA', wonBy: 'Elif Yılmaz', date: '2024-03-08' },
];

const lostQuotes = [
  { id: 'Q-1003', customer: 'Euro Import', value: 3150, currency: 'EUR', mode: 'ROAD', lostTo: 'Competitor A', reason: 'Price', date: '2024-03-12' },
  { id: 'Q-1007', customer: 'Global Freight', value: 8900, currency: 'USD', mode: 'SEA', lostTo: 'Competitor B', reason: 'Service', date: '2024-03-05' },
];

export default function WonLostReportClient({ from, to }: WonLostReportClientProps) {
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

  const stats = useMemo(() => {
    const wonCount = wonQuotes.length;
    const lostCount = lostQuotes.length;
    const total = wonCount + lostCount;
    const winRate = total > 0 ? ((wonCount / total) * 100).toFixed(1) : '0';
    const wonValue = wonQuotes.reduce((sum, q) => sum + q.value, 0);
    const lostValue = lostQuotes.reduce((sum, q) => sum + q.value, 0);
    return { wonCount, lostCount, total, winRate, wonValue, lostValue };
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Won/Lost Analysis Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date Range: ${formatDateRange()}`, 14, 30);
    doc.text(`Win Rate: ${stats.winRate}%`, 14, 40);

    autoTable(doc, {
      head: [['Won Quotes', 'Customer', 'Value', 'Won By']],
      body: wonQuotes.map((q) => [q.id, q.customer, `${q.value} ${q.currency}`, q.wonBy]),
      startY: 50,
    });

    autoTable(doc, {
      head: [['Lost Quotes', 'Customer', 'Value', 'Reason']],
      body: lostQuotes.map((q) => [q.id, q.customer, `${q.value} ${q.currency}`, q.reason]),
      startY: 100,
    });

    doc.save(`won-lost-analysis-${from}-${to}.pdf`);
  };

  const exportToExcel = () => {
    const wonSheet = XLSX.utils.json_to_sheet(wonQuotes.map(q => ({ ...q, type: 'Won' })));
    const lostSheet = XLSX.utils.json_to_sheet(lostQuotes.map(q => ({ ...q, type: 'Lost' })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wonSheet, 'Won');
    XLSX.utils.book_append_sheet(workbook, lostSheet, 'Lost');
    XLSX.writeFile(workbook, `won-lost-analysis-${from}-${to}.xlsx`);
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
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">Won/Lost Analysis Report</h1>
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
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-green-50 dark:bg-green-900/20">
              <h3 className="text-lg font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
                <span className="material-symbols-outlined">check_circle</span>
                Won Quotes ({stats.wonCount})
              </h3>
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {wonQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{q.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{q.customer}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{q.value.toLocaleString()} {q.currency}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{q.wonBy}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-900/20">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined">cancel</span>
                Lost Quotes ({stats.lostCount})
              </h3>
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">{q.reason}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Conversion Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Win Rate</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats.winRate}%</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Won Value</p>
              <span className="text-4xl font-bold text-green-600 dark:text-green-400">${stats.wonValue.toLocaleString()}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Lost Value</p>
              <span className="text-4xl font-bold text-red-600 dark:text-red-400">${stats.lostValue.toLocaleString()}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Quotes</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
