'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PersonnelReportClientProps {
  from: string;
  to: string;
  includeDrafts: boolean;
  onlyHighValue: boolean;
}

// Sample data for demonstration
const samplePersonnel = [
  {
    name: 'Elif Yılmaz',
    email: 'elif.yilmaz@shipflow.com',
    quotesCreated: 24,
    quotesWon: 14,
    quotesLost: 6,
    winRate: 58.3,
    totalValue: 285000,
    avgResponseTime: '2.4 hours',
  },
  {
    name: 'Mehmet Kaya',
    email: 'mehmet.kaya@shipflow.com',
    quotesCreated: 18,
    quotesWon: 9,
    quotesLost: 5,
    winRate: 50.0,
    totalValue: 192000,
    avgResponseTime: '3.1 hours',
  },
  {
    name: 'Ayşe Demir',
    email: 'ayse.demir@shipflow.com',
    quotesCreated: 32,
    quotesWon: 21,
    quotesLost: 7,
    winRate: 65.6,
    totalValue: 418000,
    avgResponseTime: '1.8 hours',
  },
  {
    name: 'Can Özdemir',
    email: 'can.ozdemir@shipflow.com',
    quotesCreated: 15,
    quotesWon: 7,
    quotesLost: 4,
    winRate: 46.7,
    totalValue: 145000,
    avgResponseTime: '4.2 hours',
  },
];

export default function PersonnelReportClient({
  from,
  to,
}: PersonnelReportClientProps) {
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
    const totalReps = samplePersonnel.length;
    const totalQuotes = samplePersonnel.reduce((sum, p) => sum + p.quotesCreated, 0);
    const avgWinRate = (samplePersonnel.reduce((sum, p) => sum + p.winRate, 0) / totalReps).toFixed(1);
    return { totalReps, totalQuotes, avgWinRate };
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Personnel Performance Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date Range: ${formatDateRange()}`, 14, 30);

    const tableData = samplePersonnel.map((p) => [
      p.name,
      p.email,
      p.quotesCreated.toString(),
      p.quotesWon.toString(),
      `${p.winRate.toFixed(1)}%`,
      `$${p.totalValue.toLocaleString()}`,
      p.avgResponseTime,
    ]);

    autoTable(doc, {
      head: [['Name', 'Email', 'Quotes', 'Won', 'Win Rate', 'Total Value', 'Avg Response']],
      body: tableData,
      startY: 40,
    });

    doc.save(`personnel-performance-report-${from}-${to}.pdf`);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(samplePersonnel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personnel');
    XLSX.writeFile(workbook, `personnel-performance-report-${from}-${to}.xlsx`);
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
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">Personnel Performance Report</h1>
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

        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col mb-8">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sales Rep</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Quotes Created</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Quotes Won</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Win Rate</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Total Value</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Avg Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {samplePersonnel.map((person) => (
                  <tr key={person.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{person.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{person.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-center">{person.quotesCreated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-center">{person.quotesWon}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${person.winRate}%` }} />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{person.winRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white text-right">${person.totalValue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-center">{person.avgResponseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Team Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Active Sales Reps</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats.totalReps}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Quotes</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats.totalQuotes}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Team Avg Win Rate</p>
              <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats.avgWinRate}%</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
