'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Save, 
  X, 
  Calendar, 
  Plane, 
  Ship, 
  Truck,
  User,
  Route,
  DollarSign,
  FileText,
  Container,
  Bell,
  ChevronDown,
  UserCircle,
  Building2
} from 'lucide-react';

interface Customer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

const transportModes = [
  { value: 'SEA', label: 'Sea', icon: Ship },
  { value: 'AIR', label: 'Air', icon: Plane },
  { value: 'ROAD', label: 'Land', icon: Truck },
];

const serviceTypes = [
  { value: 'FCL', label: 'FCL (Full Container Load)' },
  { value: 'LCL', label: 'LCL (Less than Container Load)' },
  { value: 'RO-RO', label: 'Ro-Ro' },
  { value: 'BREAKBULK', label: 'Breakbulk' },
];

const incoterms = [
  'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
];

const currencies = ['USD', 'EUR', 'TRY', 'GBP'];

const resultStatuses = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];

export default function NewQuotationPage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status ?? 'loading';
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    customerId: '',
    quoteDate: new Date().toISOString().split('T')[0],
    validityDate: '',
    originCountry: '',
    destinationCountry: '',
    pol: '',
    pod: '',
    transportMode: 'SEA',
    serviceType: 'FCL',
    incoterm: '',
    price: '',
    currency: 'USD',
    priceNote: '',
    resultStatus: 'PENDING',
    assignedTo: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchCustomers();
      fetchUsers();
      if (session?.user?.id) {
        setFormData(prev => ({ ...prev, assignedTo: session.user.id }));
      }
    }
  }, [status, router, session?.user?.id]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=1000');
      const result = await response.json();
      
      if (result.success) {
        setCustomers(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      // For now, we'll use a simple approach - in production this should be an API call
      setUsers([
        { id: session?.user?.id || '1', firstName: session?.user?.name?.split(' ')[0] || 'Current', lastName: session?.user?.name?.split(' ')[1] || 'User' },
      ]);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }

    if (!formData.validityDate) {
      setError('Please enter a validity date');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          originCity: formData.pol,
          originCountry: formData.originCountry,
          destinationCity: formData.pod,
          destinationCountry: formData.destinationCountry,
          transportMode: formData.transportMode,
          incoterm: formData.incoterm || undefined,
          freightCost: formData.price ? parseFloat(formData.price) : undefined,
          currency: formData.currency,
          validUntil: formData.validityDate,
          internalNotes: formData.priceNote,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/quotations/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create quotation');
      }
    } catch (err) {
      setError('An error occurred while creating the quotation');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.id === formData.customerId);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1258e2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#101622]">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 lg:px-10 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-4 text-slate-900 dark:text-slate-100">
          <div className="text-[#1258e2]">
            <Container className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Shipping CRM</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="hidden md:flex items-center gap-9">
            <Link href="/dashboard" className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              Dashboard
            </Link>
            <Link href="/quotations" className="text-sm font-bold leading-normal text-[#1258e2]">
              Quotations
            </Link>
            <Link href="/customers" className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              Customers
            </Link>
            <Link href="/settings" className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              Settings
            </Link>
          </nav>
          <div className="flex gap-2 items-center">
            <button className="flex items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium text-sm">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 lg:p-10 pb-32">
        <div className="max-w-[960px] mx-auto space-y-8">
          {/* Title */}
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                Create New Quotation
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Quote No: <span className="font-bold text-slate-700 dark:text-slate-300">TKF-2026-XXXX</span>
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#1258e2]" />
                Customer Selection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Customer <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm pl-4 pr-10 py-3 appearance-none"
                    >
                      <option value="" disabled>Search existing customers...</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.companyName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                {getSelectedCustomer() && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact</label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                      <UserCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900 dark:text-slate-100">
                        {getSelectedCustomer()?.contactName || 'N/A'}
                      </span>
                      <span className="text-slate-500">
                        ({getSelectedCustomer()?.email || 'N/A'})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Dates */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1258e2]" />
                Dates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quote Date</label>
                  <input
                    type="date"
                    name="quoteDate"
                    value={formData.quoteDate}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Validity Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="validityDate"
                    value={formData.validityDate}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Route */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Route className="w-5 h-5 text-[#1258e2]" />
                Shipping Route
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Origin Country</label>
                  <select
                    name="originCountry"
                    value={formData.originCountry}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  >
                    <option value="" disabled>Select country</option>
                    <option value="China">China</option>
                    <option value="Germany">Germany</option>
                    <option value="United States">United States</option>
                    <option value="Turkey">Turkey</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Destination Country</label>
                  <select
                    name="destinationCountry"
                    value={formData.destinationCountry}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  >
                    <option value="" disabled>Select country</option>
                    <option value="China">China</option>
                    <option value="Germany">Germany</option>
                    <option value="United States">United States</option>
                    <option value="Turkey">Turkey</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Port of Loading (POL)</label>
                  <input
                    type="text"
                    name="pol"
                    value={formData.pol}
                    onChange={handleChange}
                    placeholder="Enter POL"
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Port of Discharge (POD)</label>
                  <input
                    type="text"
                    name="pod"
                    value={formData.pod}
                    onChange={handleChange}
                    placeholder="Enter POD"
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  />
                </div>
                
                {/* Transport Mode Radio */}
                <div className="flex flex-col gap-1.5 md:col-span-2 mt-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Transport Mode</label>
                  <div className="flex gap-4">
                    {transportModes.map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <label key={mode.value} className="cursor-pointer relative flex-1">
                          <input
                            type="radio"
                            name="transportMode"
                            value={mode.value}
                            checked={formData.transportMode === mode.value}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 peer-checked:border-[#1258e2] peer-checked:bg-[#1258e2]/5 flex items-center justify-center gap-2 transition-all">
                            <Icon className={`w-5 h-5 ${formData.transportMode === mode.value ? 'text-[#1258e2]' : 'text-slate-600 dark:text-slate-400'}`} />
                            <span className={`font-medium ${formData.transportMode === mode.value ? 'text-[#1258e2]' : 'text-slate-700 dark:text-slate-300'}`}>
                              {mode.label}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Type</label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Incoterm</label>
                  <select
                    name="incoterm"
                    value={formData.incoterm}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  >
                    <option value="" disabled>Select Incoterm</option>
                    {incoterms.map((term) => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#1258e2]" />
                Pricing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price</label>
                  <div className="relative flex rounded-lg">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      className="block w-full rounded-none rounded-l-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="block w-24 rounded-none rounded-r-lg border-l-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-3 py-3"
                    >
                      {currencies.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price Note</label>
                  <textarea
                    name="priceNote"
                    value={formData.priceNote}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Add any additional pricing notes or conditions here..."
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3 resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Assignment */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#1258e2]" />
                Assignment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assigned Representative</label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  >
                    <option value={session?.user?.id}>
                      {session?.user?.name || 'Current User'} (You)
                    </option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Result Status</label>
                  <select
                    name="resultStatus"
                    value={formData.resultStatus}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1258e2] focus:ring-[#1258e2] focus:ring-1 sm:text-sm px-4 py-3"
                  >
                    {resultStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </form>
        </div>
      </main>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] py-4 px-6 lg:px-10 z-10 flex justify-end gap-4">
        <Link
          href="/quotations"
          className="px-6 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-600"
        >
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg font-bold text-white bg-[#1258e2] hover:bg-[#1258e2]/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Quote'}
        </button>
      </div>
    </div>
  );
}
