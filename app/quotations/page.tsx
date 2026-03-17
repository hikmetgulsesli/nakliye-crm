'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Plane,
  Ship,
  Truck,
  ArrowRight,
  MoreVertical,
  Calendar,
  Menu,
  Bell,
  Anchor,
  Container,
  Users,
  Package,
  BarChart3,
  Settings,
  SlidersHorizontal
} from 'lucide-react';

interface Quotation {
  id: string;
  quoteNumber: string;
  status: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  transportMode: string;
  serviceType?: string;
  totalCost: number | null;
  currency: string;
  validUntil: string | null;
  createdAt: string;
  customer: {
    id: string;
    companyName: string;
    contactName: string | null;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { 
    bg: 'bg-slate-100 dark:bg-slate-700', 
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-600'
  },
  SENT: { 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/50'
  },
  ACCEPTED: { 
    bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/50'
  },
  REJECTED: { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800/50'
  },
  EXPIRED: { 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/50'
  },
  CANCELLED: { 
    bg: 'bg-gray-100 dark:bg-gray-700', 
    text: 'text-gray-800 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-600'
  },
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

const TransportIcon = ({ mode }: { mode: string }) => {
  switch (mode) {
    case 'AIR':
      return <Plane className="w-4 h-4 text-sky-500" />;
    case 'SEA':
      return <Ship className="w-4 h-4 text-blue-500" />;
    case 'ROAD':
    case 'RAIL':
      return <Truck className="w-4 h-4 text-emerald-600" />;
    default:
      return <Ship className="w-4 h-4 text-blue-500" />;
  }
};

const TransportLabel = ({ mode }: { mode: string }) => {
  switch (mode) {
    case 'AIR':
      return 'Air';
    case 'SEA':
      return 'Sea';
    case 'ROAD':
      return 'Land';
    case 'RAIL':
      return 'Rail';
    default:
      return mode;
  }
};

export default function QuotationListPage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status ?? 'loading';
  const router = useRouter();
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transportModeFilter, setTransportModeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchQuotations();
    }
  }, [status, router, pagination.page, search, statusFilter, transportModeFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (transportModeFilter) params.set('transportMode', transportModeFilter);
      
      const response = await fetch(`/api/quotations?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setQuotations(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.error || 'Failed to fetch quotations');
      }
    } catch (err) {
      setError('An error occurred while fetching quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQuotations();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTransportModeFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasFilters = search || statusFilter || transportModeFilter;

  return (
    <div className="flex h-screen bg-[#f6f6f8] dark:bg-[#101622]">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="bg-primary/10 dark:bg-primary/20 text-primary p-2 rounded-lg">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Shipping CRM</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Global Logistics</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="text-[20px]"><Container className="w-5 h-5" /></span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link 
            href="/quotations" 
            className="flex items-center gap-3 px-3 py-2 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg transition-colors"
          >
            <span className="text-[20px]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></span>
            <span className="text-sm font-medium">Quotations</span>
          </Link>
          <Link 
            href="/shipments" 
            className="flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="text-[20px]"><Truck className="w-5 h-5" /></span>
            <span className="text-sm font-medium">Shipments</span>
          </Link>
          <Link 
            href="/customers" 
            className="flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="text-[20px]"><Users className="w-5 h-5" /></span>
            <span className="text-sm font-medium">Customers</span>
          </Link>
          <Link 
            href="/invoices" 
            className="flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="text-[20px]"><Package className="w-5 h-5" /></span>
            <span className="text-sm font-medium">Invoices</span>
          </Link>
          <Link 
            href="/reports" 
            className="flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="text-[20px]"><BarChart3 className="w-5 h-5" /></span>
            <span className="text-sm font-medium">Reports</span>
          </Link>
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <Link 
              href="/settings" 
              className="flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span className="text-[20px]"><Settings className="w-5 h-5" /></span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Sales Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold tracking-tight">Quotation List</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link
              href="/quotations/new"
              className="bg-[#1258e2] hover:bg-[#1258e2]/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Quotation
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search quotes, customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-[#1258e2] outline-none transition-all dark:text-white placeholder-slate-400"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-[#1258e2] outline-none transition-all"
                >
                  <option value="">Status: All</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={transportModeFilter}
                  onChange={(e) => setTransportModeFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-[#1258e2] outline-none transition-all"
                >
                  <option value="">Transport: All</option>
                  <option value="AIR">Air Freight</option>
                  <option value="SEA">Sea Freight</option>
                  <option value="ROAD">Land Transport</option>
                </select>
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Calendar className="w-4 h-4" />
                Date Range
              </button>
              <button 
                className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="More Filters"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Table Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 font-medium">Quote No</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Transport</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Route (Origin → Dest)</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1258e2] mx-auto"></div>
                      </td>
                    </tr>
                  ) : quotations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        No quotations found. Create your first quotation to get started.
                      </td>
                    </tr>
                  ) : (
                    quotations.map((quote) => {
                      const statusStyle = statusColors[quote.status] || statusColors.DRAFT;
                      return (
                        <tr key={quote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link 
                              href={`/quotations/${quote.id}`}
                              className="font-medium text-[#1258e2] hover:underline"
                            >
                              {quote.quoteNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{quote.customer.companyName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {quote.originCountry?.slice(0, 2).toUpperCase() || 'XX'}-{quote.originCity?.slice(0, 3).toUpperCase() || 'XXX'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <TransportIcon mode={quote.transportMode} />
                              <TransportLabel mode={quote.transportMode} />
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {quote.serviceType || 'FCL'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <span>{quote.originCity}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span>{quote.destinationCity}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                            {formatCurrency(quote.totalCost, quote.currency).replace('$', '').replace('€', '').replace('£', '')} 
                            <span className="text-slate-500 text-xs font-normal ml-1">{quote.currency}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                              {statusLabels[quote.status] || quote.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {quote.createdBy.firstName} {quote.createdBy.lastName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button className="text-slate-400 hover:text-[#1258e2] transition-colors opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-medium text-slate-900 dark:text-slate-100">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">{pagination.total}</span> results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === page
                            ? 'bg-[#1258e2] text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {pagination.totalPages > 5 && (
                    <>
                      <span className="text-slate-400 px-1">...</span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
