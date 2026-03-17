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
  Train,
  User,
  Route,
  Package,
  DollarSign,
  FileText
} from 'lucide-react';

interface Customer {
  id: string;
  companyName: string;
  contactName: string | null;
}

const transportModes = [
  { value: 'AIR', label: 'Air Freight', icon: Plane },
  { value: 'SEA', label: 'Sea Freight', icon: Ship },
  { value: 'ROAD', label: 'Road Transport', icon: Truck },
  { value: 'RAIL', label: 'Rail Transport', icon: Train },
  { value: 'MULTIMODAL', label: 'Multimodal', icon: Route },
];

const incoterms = [
  'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
];

const currencies = ['USD', 'EUR', 'TRY', 'GBP'];

export default function NewQuotationPage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status ?? 'loading';
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    customerId: '',
    originCity: '',
    originCountry: '',
    destinationCity: '',
    destinationCountry: '',
    transportMode: 'SEA',
    incoterm: '',
    cargoDescription: '',
    weightKg: '',
    volumeM3: '',
    packagesCount: '',
    freightCost: '',
    originCharges: '',
    destinationCharges: '',
    insuranceCost: '',
    totalCost: '',
    currency: 'USD',
    validUntil: '',
    estimatedTransitDays: '',
    internalNotes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchCustomers();
    }
  }, [status, router]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    const freight = parseFloat(formData.freightCost) || 0;
    const origin = parseFloat(formData.originCharges) || 0;
    const destination = parseFloat(formData.destinationCharges) || 0;
    const insurance = parseFloat(formData.insuranceCost) || 0;
    const total = freight + origin + destination + insurance;
    setFormData(prev => ({ ...prev, totalCost: total.toFixed(2) }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.freightCost, formData.originCharges, formData.destinationCharges, formData.insuranceCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
          volumeM3: formData.volumeM3 ? parseFloat(formData.volumeM3) : undefined,
          packagesCount: formData.packagesCount ? parseInt(formData.packagesCount) : undefined,
          freightCost: formData.freightCost ? parseFloat(formData.freightCost) : undefined,
          originCharges: formData.originCharges ? parseFloat(formData.originCharges) : undefined,
          destinationCharges: formData.destinationCharges ? parseFloat(formData.destinationCharges) : undefined,
          insuranceCost: formData.insuranceCost ? parseFloat(formData.insuranceCost) : undefined,
          totalCost: formData.totalCost ? parseFloat(formData.totalCost) : undefined,
          estimatedTransitDays: formData.estimatedTransitDays ? parseInt(formData.estimatedTransitDays) : undefined,
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

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Create New Quotation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create a new shipping quotation for your customer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Quotation'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Customer Selection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              >
                <option value="">Search existing customers...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName} {customer.contactName ? `(${customer.contactName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Route Information */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Route Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Origin City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="originCity"
                value={formData.originCity}
                onChange={handleChange}
                required
                placeholder="e.g., Shanghai"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Origin Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="originCountry"
                value={formData.originCountry}
                onChange={handleChange}
                required
                placeholder="e.g., China"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Destination City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destinationCity"
                value={formData.destinationCity}
                onChange={handleChange}
                required
                placeholder="e.g., Istanbul"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Destination Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="destinationCountry"
                value={formData.destinationCountry}
                onChange={handleChange}
                required
                placeholder="e.g., Türkiye"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              />
            </div>
          </div>
        </section>

        {/* Transport & Incoterm */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            Transport & Terms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transport Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {transportModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, transportMode: mode.value }))}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.transportMode === mode.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Incoterm
              </label>
              <select
                name="incoterm"
                value={formData.incoterm}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              >
                <option value="">Select Incoterm...</option>
                {incoterms.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Cargo Details */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Cargo Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Volume (m³)
              </label>
              <input
                type="number"
                name="volumeM3"
                value={formData.volumeM3}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Packages Count
              </label>
              <input
                type="number"
                name="packagesCount"
                value={formData.packagesCount}
                onChange={handleChange}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cargo Description
            </label>
            <textarea
              name="cargoDescription"
              value={formData.cargoDescription}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the cargo..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
            />
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Freight Cost
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="freightCost"
                  value={formData.freightCost}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Origin Charges
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="originCharges"
                  value={formData.originCharges}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Destination Charges
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="destinationCharges"
                  value={formData.destinationCharges}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Insurance Cost
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="insuranceCost"
                  value={formData.insuranceCost}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Cost
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  name="totalCost"
                  value={formData.totalCost}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  readOnly
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Additional Information */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Valid Until
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Estimated Transit Days
              </label>
              <input
                type="number"
                name="estimatedTransitDays"
                value={formData.estimatedTransitDays}
                onChange={handleChange}
                placeholder="e.g., 14"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes
            </label>
            <textarea
              name="internalNotes"
              value={formData.internalNotes}
              onChange={handleChange}
              rows={4}
              placeholder="Add any internal notes or comments..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent px-4 py-3"
            />
          </div>
        </section>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/quotations"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
}
