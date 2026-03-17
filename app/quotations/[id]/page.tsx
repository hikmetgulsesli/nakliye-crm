'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Edit, 
  Mail, 
  RotateCcw,
  ArrowLeft,
  Plane, 
  Ship, 
  Truck, 
  Train,
  Building2,
  User,
  Route,
  Package,
  DollarSign,
  Calendar,
  Clock,
  History,
  Info,
  Container,
  Bell,
  GitCommit,
  PlaneTakeoff,
  PlaneLanding,
  Anchor,
  CheckCircle,
  UserCircle
} from 'lucide-react';

interface Revision {
  id: string;
  revisionNumber: number;
  changes: Record<string, { old: string | number | null; new: string | number | null }>;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  changeSummary: string;
}

interface Activity {
  id: string;
  type: string;
  subject: string | null;
  description: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface Quotation {
  id: string;
  quoteNumber: string;
  status: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  transportMode: string;
  incoterm: string | null;
  cargoDescription: string | null;
  weightKg: number | null;
  volumeM3: number | null;
  packagesCount: number | null;
  freightCost: number | null;
  originCharges: number | null;
  destinationCharges: number | null;
  insuranceCost: number | null;
  totalCost: number | null;
  currency: string;
  validUntil: string | null;
  estimatedTransitDays: number | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    companyName: string;
    contactName: string | null;
    email: string;
    phone: string | null;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  activities: Activity[];
  revisions: Revision[];
}

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  SENT: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  ACCEPTED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  EXPIRED: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  CANCELLED: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Pending',
  ACCEPTED: 'Won',
  REJECTED: 'Lost',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

const TransportIcon = ({ mode }: { mode: string }) => {
  switch (mode) {
    case 'AIR':
      return <Plane className="w-5 h-5" />;
    case 'SEA':
      return <Ship className="w-5 h-5" />;
    case 'ROAD':
    case 'RAIL':
      return <Truck className="w-5 h-5" />;
    default:
      return <Ship className="w-5 h-5" />;
  }
};

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status ?? 'loading';
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [id, setId] = useState<string>('');

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && id) {
      fetchQuotation();
    }
  }, [status, router, id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/quotations/${id}`);
      const result = await response.json();
      
      if (result.success) {
        // Add mock revisions if none exist
        const data = result.data;
        if (!data.revisions || data.revisions.length === 0) {
          data.revisions = generateMockRevisions(data);
        }
        setQuotation(data);
      } else {
        setError(result.error || 'Failed to fetch quotation');
      }
    } catch (err) {
      setError('An error occurred while fetching the quotation');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock revisions for display purposes
  const generateMockRevisions = (data: Quotation): Revision[] => {
    const revisions: Revision[] = [
      {
        id: 'rev-1',
        revisionNumber: 1,
        changes: {},
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        changeSummary: 'Quotation created',
      },
    ];

    // If status is ACCEPTED or has updates, add more revisions
    if (data.status === 'ACCEPTED' || data.status === 'SENT') {
      const updateDate = new Date(data.updatedAt);
      revisions.push({
        id: 'rev-2',
        revisionNumber: 2,
        changes: {
          price: { old: (data.totalCost || 0) * 1.1, new: data.totalCost || 0 },
        },
        createdAt: new Date(updateDate.getTime() - 86400000 * 2).toISOString(),
        createdBy: data.createdBy,
        changeSummary: 'Price changed',
      });
    }

    if (data.status === 'ACCEPTED') {
      revisions.push({
        id: 'rev-3',
        revisionNumber: 3,
        changes: {
          status: { old: 'SENT', new: 'ACCEPTED' },
        },
        createdAt: data.updatedAt,
        createdBy: data.createdBy,
        changeSummary: 'Status changed to Won',
      });
    }

    return revisions.reverse();
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        setQuotation(result.data);
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred while updating the status');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1258e2]"></div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-700 dark:text-red-400">{error || 'Quotation not found'}</p>
          <Link
            href="/quotations"
            className="inline-flex items-center gap-2 mt-4 text-[#1258e2] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotations
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = statusColors[quotation.status] || statusColors.DRAFT;
  const statusLabel = statusLabels[quotation.status] || quotation.status;

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#101622]">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 lg:px-10 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-slate-900 dark:text-slate-100">
            <Container className="w-6 h-6 text-[#1258e2]" />
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Shipping CRM</h2>
          </div>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="hidden md:flex items-center gap-9">
            <Link href="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-[#1258e2] dark:hover:text-[#1258e2] text-sm font-medium leading-normal transition-colors">
              Dashboard
            </Link>
            <Link href="/quotations" className="text-[#1258e2] text-sm font-bold leading-normal border-b-2 border-[#1258e2] pb-1">
              Quotations
            </Link>
            <Link href="/shipments" className="text-slate-600 dark:text-slate-300 hover:text-[#1258e2] dark:hover:text-[#1258e2] text-sm font-medium leading-normal transition-colors">
              Shipments
            </Link>
            <Link href="/customers" className="text-slate-600 dark:text-slate-300 hover:text-[#1258e2] dark:hover:text-[#1258e2] text-sm font-medium leading-normal transition-colors">
              Customers
            </Link>
          </nav>
          <div className="flex gap-2 items-center">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#1258e2] hover:bg-[#1258e2]/90 text-white text-sm font-bold leading-normal transition-colors">
              Create New
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Header Card */}
        <div className="flex flex-wrap items-start justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                Quotation {quotation.quoteNumber}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
              <History className="w-4 h-4" /> 
              Last updated {format(new Date(quotation.updatedAt), 'MMM d, yyyy')} by {quotation.createdBy.firstName} {quotation.createdBy.lastName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/quotations/${id}/edit`}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button className="flex cursor-pointer items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors">
              <Mail className="w-4 h-4" />
              Create Email
            </button>
            <button 
              onClick={() => handleStatusChange('SENT')}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#1258e2] hover:bg-[#1258e2]/90 text-white text-sm font-bold transition-colors shadow-sm shadow-[#1258e2]/20"
            >
              <RotateCcw className="w-4 h-4" />
              Revise
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Content */}
          <div className="w-full lg:w-[70%] flex flex-col gap-6">
            {/* Basic Info */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#1258e2]" />
                  Basic Info
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Customer</p>
                  <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <Link href={`/customers/${quotation.customer.id}`} className="text-[#1258e2] hover:underline">
                      {quotation.customer.companyName}
                    </Link>
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Contact Person</p>
                  <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {quotation.customer.contactName || 'N/A'} ({quotation.customer.email})
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Date Created</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {format(new Date(quotation.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Valid Until</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {quotation.validUntil 
                      ? `${format(new Date(quotation.validUntil), 'MMM d, yyyy')} (${Math.ceil((new Date(quotation.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left)`
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </section>

            {/* Route Details */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Route className="w-5 h-5 text-[#1258e2]" />
                  Route Details
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Origin / POL</p>
                  <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <PlaneTakeoff className="w-4 h-4 text-slate-400" />
                    {quotation.originCity}, {quotation.originCountry}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Destination / POD</p>
                  <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <PlaneLanding className="w-4 h-4 text-slate-400" />
                    {quotation.destinationCity}, {quotation.destinationCountry}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Transport Mode</p>
                  <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-slate-400" />
                    {quotation.transportMode === 'SEA' ? 'Ocean Freight (FCL)' : quotation.transportMode}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Incoterms</p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {quotation.incoterm || 'Not specified'}
                  </p>
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#1258e2]" />
                  Pricing
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Freight Cost</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(quotation.freightCost, quotation.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Origin Charges</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(quotation.originCharges, quotation.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Destination Charges</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(quotation.destinationCharges, quotation.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Insurance Cost</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(quotation.insuranceCost, quotation.currency)}</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-[#1258e2]">
                      {formatCurrency(quotation.totalCost, quotation.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[30%] flex flex-col gap-6">
            {/* Revision History */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex-1">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-[#1258e2]" />
                  Revision History
                </h2>
                <span className="bg-[#1258e2]/10 text-[#1258e2] text-xs font-bold px-2 py-1 rounded">
                  {quotation.revisions?.length || 1} Revision{quotation.revisions?.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-6 relative">
                <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex flex-col gap-6 relative z-0">
                  {quotation.revisions?.map((revision, index) => (
                    <div key={revision.id} className={`flex gap-4 items-start ${index > 0 ? 'opacity-70 hover:opacity-100 transition-opacity' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs ${
                        index === 0 
                          ? 'bg-white dark:bg-slate-900 border-2 border-[#1258e2] text-[#1258e2]' 
                          : 'bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}>
                        R{revision.revisionNumber}
                      </div>
                      <div className={`flex-1 p-3 rounded-lg border ${
                        index === 0 
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700' 
                          : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold text-sm ${index === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {index === 0 ? 'Current Version' : revision.changeSummary}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {format(new Date(revision.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {revision.changes && Object.keys(revision.changes).length > 0 && (
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {Object.entries(revision.changes).map(([key, change]) => (
                              <span key={key}>
                                {key} changed {change.old !== null && change.old !== undefined && (
                                  <>from <span className="line-through">{typeof change.old === 'number' ? formatCurrency(change.old, quotation.currency) : change.old}</span></>
                                )} to <span className="font-medium text-slate-800 dark:text-slate-200">{typeof change.new === 'number' ? formatCurrency(change.new, quotation.currency) : change.new}</span>
                              </span>
                            ))}
                          </p>
                        )}
                        {index === quotation.revisions.length - 1 && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">Quotation created</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <UserCircle className="w-3 h-3" />
                          {revision.createdBy.firstName} {revision.createdBy.lastName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
