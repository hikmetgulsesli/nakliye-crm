'use client';

import Link from 'next/link';

interface ReportHeaderProps {
  title: string;
  dateRange: string;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export default function ReportHeader({ title, dateRange, onExportPDF, onExportExcel }: ReportHeaderProps) {
  return (
    <>
      {/* TopNavBar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-10 py-3 shrink-0">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-6 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">sailing</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
            ShipFlow CRM
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="flex items-center gap-9">
            <Link
              className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="text-sm font-bold leading-normal text-primary border-b-2 border-primary pb-1"
              href="/reports"
            >
              Reports
            </Link>
            <Link
              className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              href="#"
            >
              Quotes
            </Link>
            <Link
              className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              href="#"
            >
              Customers
            </Link>
            <Link
              className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              href="#"
            >
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 transition-colors">
              <span className="truncate">Create Quote</span>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col items-center py-8 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto overflow-hidden">
        {/* Header Section */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
              Active Date Range: {dateRange}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onExportPDF}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
              <span>Export PDF</span>
            </button>
            <button
              onClick={onExportExcel}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">table_chart</span>
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
