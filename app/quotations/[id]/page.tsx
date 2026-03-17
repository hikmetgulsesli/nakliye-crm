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
  Info
} from 'lucide-react';

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
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
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
        setQuotation(result.data);
      } else {
        setError(result.error || 'Failed to fetch quotation');
      }
    } catch (err) {
      setError('An error occurred while fetching the quotation');
    } finally {
      setLoading(false);
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/quotations"
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Quotation {quotation.quoteNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${statusColors[quotation.status]}`}>
              {quotation.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 ml-10">
            <History className="w-4 h-4" />
            Last updated {format(new Date(quotation.updatedAt), 'MMM d, yyyy')} by {quotation.createdBy.firstName} {quotation.createdBy.lastName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/quotations/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors">
            <Mail className="w-4 h-4" />
            Create Email
          </button>
          <button 
            onClick={() => handleStatusChange('SENT')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Revise
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Basic Info */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Basic Info
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Customer</p>
                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <Link href={`/customers/${quotation.customer.id}`} className="text-primary hover:underline">
                    {quotation.customer.companyName}
                  </Link>
                </p>
                {quotation.customer.contactName && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Contact: {quotation.customer.contactName}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Created By</p>
                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-slate-400" />
                  {quotation.createdBy.firstName} {quotation.createdBy.lastName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {quotation.createdBy.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Created At</p>
                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {format(new Date(quotation.createdAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Valid Until</p>
                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {quotation.validUntil 
                    ? format(new Date(quotation.validUntil), 'MMM d, yyyy')
                    : 'Not set'}
                </p>
              </div>
            </div>
          </section>

          {/* Route Details */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Route className="w-5 h-5 text-primary" />
                Route Details
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Origin</p>
                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mt-1">
                  <Plane className="w-4 h-4 text-slate-400 rotate-[-45deg]" />
                  {quotation.originCity}, {quotation.originCountry}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Destination</p>
                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mt-1">
                  <Plane className="w-4 h-4 text-slate-400 rotate-[45deg]" />
                  {quotation.destinationCity}, {quotation.destinationCountry}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Transport Mode</p>
                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2 mt-1">
                  <TransportIcon mode={quotation.transportMode} />
                  {quotation.transportMode}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Incoterm</p>
                <p className="text-slate-900 dark:text-white font-medium mt-1">
                  {quotation.incoterm || 'Not specified'}
                </p>
              </div>
              {quotation.estimatedTransitDays && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Estimated Transit</p>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">
                    {quotation.estimatedTransitDays} days
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Cargo Details */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Cargo Details
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Weight</p>
                <p className="text-slate-900 dark:text-white font-medium mt-1">
                  {quotation.weightKg ? `${quotation.weightKg} kg` : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Volume</p>
                <p className="text-slate-900 dark:text-white font-medium mt-1">
                  {quotation.volumeM3 ? `${quotation.volumeM3} m³` : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Packages</p>
                <p className="text-slate-900 dark:text-white font-medium mt-1">
                  {quotation.packagesCount ?? 'Not specified'}
                </p>
              </div>
              {quotation.cargoDescription && (
                <div className="md:col-span-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Description</p>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {quotation.cargoDescription}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Pricing
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Freight Cost</span>
                  <span className="font-medium">{formatCurrency(quotation.freightCost, quotation.currency)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Origin Charges</span>
                  <span className="font-medium">{formatCurrency(quotation.originCharges, quotation.currency)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Destination Charges</span>
                  <span className="font-medium">{formatCurrency(quotation.destinationCharges, quotation.currency)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Insurance Cost</span>
                  <span className="font-medium">{formatCurrency(quotation.insuranceCost, quotation.currency)}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(quotation.totalCost, quotation.currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Internal Notes */}
          {quotation.internalNotes && (
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Internal Notes
                </h2>
              </div>
              <div className="p-6">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {quotation.internalNotes}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Activity History */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Activity History
              </h2>
            </div>
            <div className="p-6">
              {quotation.activities.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  No activities recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {quotation.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <History className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {activity.type.replace(/_/g, ' ')}
                        </p>
                        {activity.subject && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {activity.subject}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {activity.user.firstName} {activity.user.lastName} • {' '}
                          {format(new Date(activity.createdAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
