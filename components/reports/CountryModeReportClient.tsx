'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CountryModeReportClientProps {
  from: string;
  to: string;
  includeDrafts: boolean;
  onlyHighValue: boolean;
}

const countryData = [
  { country: 'USA', sea: 45, air: 32, road: 12, total: 89 },
  { country: 'Germany', sea: 28, air: 18, road: 35, total: 81 },
  { country: 'China', sea: 67, air: 45, road: 8, total: 120 },
  { country: 'UK', sea: 22, air: 28, road: 15, total: 65 },
  { country: 'France', sea: 18, air: 15, road: 22, total: 55 },
];

const modeData = [
  { mode: 'SEA', count: 180, percentage: 45, value: 2450000 },
  { mode: 'AIR', count: 138, percentage: 34.5, value: 4200000 },
  { mode: 'ROAD', count: 82, percentage: 20.5, value: 890000 },
];

export default function CountryModeReportClient({ from, to }: CountryModeReportClientProps) {
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

  const totalQuotes = useMemo(() => countryData.reduce((sum, c) => sum + c.total, 0), []);
  const totalValue = useMemo(() => modeData.reduce((sum, m) => sum + m.value, 0), []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Country/Mode Volume Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date Range: ${formatDateRange()}`, 14, 30);

    autoTable(doc, {
      head: [['Country', 'Sea', 'Air', 'Road', 'Total']],
      body: countryData.map((c) => [c.country, String(c.sea), String(c.air), String(c.road), String(c.total)]),
      startY: 40,
    });

    doc.save(`country-mode-volume-${from}-${to}.pdf`);
  };

  const exportToExcel = () => {
    const countrySheet = XLSX.utils.json_to_sheet(countryData);
    const modeSheet = XLSX.utils.json_to_sheet(modeData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, countrySheet, 'By Country');
    XLSX.utils.book_append_sheet(workbook, modeSheet, 'By Mode');
    XLSX.writeFile(workbook, `country-mode-volume-${from}-${to}.xlsx`);
  };

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      SEA: 'bg-blue-500',
      AIR: 'bg-sky-400',
      ROAD: 'bg-emerald-500',
    };
    return colors[mode] || 'bg-slate-500';
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
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">Country/Mode Volume Report</h1>
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Volume by Country</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Country</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-center">Sea</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-center">Air</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-center">Road</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {countryData.map((c) => (
                  <tr key={c.country} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{c.country}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-center">{c.sea}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-center">{c.air}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-center">{c.road}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Volume by Transport Mode</h3>
            </div>
            <div className="p-6">
              {modeData.map((m) => (
                <div key={m.mode} className="mb-6 last:mb-0">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getModeColor(m.mode)}`} />
                      <span className="font-medium text-slate-900 dark:text-white">{m.mode}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{m.count}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({m.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${getModeColor(m.mode)} rounded-full`} style={{ width: `${m.percentage}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">${m.value.toLocaleString()} total value</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Volume Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Quotes</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">{totalQuotes}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Value</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">${totalValue.toLocaleString()}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Top Country</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">China</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">120 quotes</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
