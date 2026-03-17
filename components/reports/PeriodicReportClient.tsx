'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PeriodicReportClientProps {
  from: string;
  to: string;
  includeDrafts: boolean;
  onlyHighValue: boolean;
}

// Sample data for demonstration
const sampleQuotes = [
  {
    id: 'Q-1001',
    customer: 'Acme Corp',
    mode: 'AIR',
    origin: 'New York (JFK)',
    destination: 'London (LHR)',
    price: 12500,
    currency: 'USD',
    status: 'Won',
    resultDate: '2024-03-15',
  },
  {
    id: 'Q-1002',
    customer: 'Global Traders',
    mode: 'SEA',
    origin: 'Shanghai (CNSHA)',
    destination: 'Los Angeles (USLAX)',
    price: 8200,
    currency: 'USD',
    status: 'Pending',
    resultDate: '2024-03-14',
  },
  {
    id: 'Q-1003',
    customer: 'Euro Import',
    mode: 'ROAD',
    origin: 'Berlin (DEBER)',
    destination: 'Paris (FRPAR)',
    price: 3150,
    currency: 'EUR',
    status: 'Lost',
    resultDate: '2024-03-12',
  },
  {
    id: 'Q-1004',
    customer: 'Tech Logistics',
    mode: 'AIR',
    origin: 'Tokyo (HND)',
    destination: 'San Francisco (SFO)',
    price: 15800,
    currency: 'USD',
    status: 'Won',
    resultDate: '2024-03-10',
  },
  {
    id: 'Q-1005',
    customer: 'Fast Track',
    mode: 'SEA',
    origin: 'Mumbai (INBOM)',
    destination: 'Dubai (AEDXB)',
    price: 6400,
    currency: 'USD',
    status: 'Won',
    resultDate: '2024-03-08',
  },
];

export default function PeriodicReportClient({
  from,
  to,
  includeDrafts,
  onlyHighValue,
}: PeriodicReportClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [transportFilter, setTransportFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('All');

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

  const filteredQuotes = useMemo(() => {
    return sampleQuotes.filter((quote) => {
      if (statusFilter !== 'All' && quote.status !== statusFilter) return false;
      if (transportFilter !== 'All' && quote.mode !== transportFilter) return false;
      if (currencyFilter !== 'All' && quote.currency !== currencyFilter) return false;
      if (onlyHighValue && quote.price < 10000) return false;
      return true;
    });
  }, [statusFilter, transportFilter, currencyFilter, onlyHighValue]);

  const stats = useMemo(() => {
    const total = filteredQuotes.length;
    const won = filteredQuotes.filter((q) => q.status === 'Won').length;
    const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0';

    const currencyTotals: Record<string, number> = {};
    filteredQuotes.forEach((q) => {
      currencyTotals[q.currency] = (currencyTotals[q.currency] || 0) + q.price;
    });

    return { total, won, winRate, currencyTotals };
  }, [filteredQuotes]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Periodic Quotation Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date Range: ${formatDateRange()}`, 14, 30);

    const tableData = filteredQuotes.map((q) => [
      q.id,
      q.customer,
      q.mode,
      q.origin,
      q.destination,
      `${q.price.toLocaleString()} ${q.currency}`,
      q.status,
      formatDate(q.resultDate),
    ]);

    autoTable(doc, {
      head: [['Quote No', 'Customer', 'Mode', 'Origin', 'Destination', 'Price', 'Status', 'Result Date']],
      body: tableData,
      startY: 40,
    });

    doc.save(`periodic-quotation-report-${from}-${to}.pdf`);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredQuotes.map((q) => ({
        'Quote No': q.id,
        Customer: q.customer,
        Mode: q.mode,
        Origin: q.origin,
        Destination: q.destination,
        Price: q.price,
        Currency: q.currency,
        Status: q.status,
        'Result Date': formatDate(q.resultDate),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotations');
    XLSX.writeFile(workbook, `periodic-quotation-report-${from}-${to}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Won: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      Lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status] || 'bg-slate-100 text-slate-800';
  };

  const getModeIcon = (mode: string) => {
    const icons: Record<string, string> = {
      AIR: 'flight',
      SEA: 'directions_boat',
      ROAD: 'local_shipping',
      RAIL: 'train',
    };
    return icons[mode] || 'local_shipping';
  };

  return (
    <>
      {/* TopNavBar */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-8 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto overflow-hidden">
        {/* Header Section */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">Periodic Quotation Report Preview</h1>
            <p className="text-sm font-normal text-slate-500 dark:text-slate-400">Active Date Range: {formatDateRange()}</p>
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

        {/* Filters */}
        <div className="w-full flex gap-3 mb-6 flex-wrap">
          <button className="flex h-9 items-center justify-between gap-x-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[140px]">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status: {statusFilter}</span>
            <span className="material-symbols-outlined text-slate-500 text-sm">expand_more</span>
          </button>
          <button className="flex h-9 items-center justify-between gap-x-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[180px]">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Transport Mode: {transportFilter}</span>
            <span className="material-symbols-outlined text-slate-500 text-sm">expand_more</span>
          </button>
          <button className="flex h-9 items-center justify-between gap-x-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[140px]">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency: {currencyFilter}</span>
            <span className="material-symbols-outlined text-slate-500 text-sm">expand_more</span>
          </button>
          <button className="flex h-9 items-center justify-center rounded-lg text-primary hover:bg-primary/10 px-3 py-2 transition-colors ml-auto text-sm font-medium gap-1 cursor-pointer">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            More Filters
          </button>
        </div>

        {/* Data Table */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col mb-8">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Quote No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Mode</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Origin</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Destination</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">Price</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Result Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{quote.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{quote.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-sm">{getModeIcon(quote.mode)}</span>
                      {quote.mode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{quote.origin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{quote.destination}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white text-right">
                      {quote.price.toLocaleString()} <span className="text-xs text-slate-500 font-normal">{quote.currency}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatDate(quote.resultDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Showing 1 to {filteredQuotes.length} of {filteredQuotes.length} entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">Prev</button>
              <button className="px-3 py-1 rounded bg-primary text-white text-sm">1</button>
              <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">2</button>
              <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">3</button>
              <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="w-full">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Report Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Quotes Processed</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center mb-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span> 12% vs last period
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Total Value by Currency</p>
              <div className="flex flex-col gap-3">
                {Object.entries(stats.currencyTotals).map(([currency, total]) => (
                  <div key={currency} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{currency}</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overall Win Rate</p>
                <span className="material-symbols-outlined text-primary">emoji_events</span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{stats.winRate}%</div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${stats.winRate}%` }} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-right">Target: 65%</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
