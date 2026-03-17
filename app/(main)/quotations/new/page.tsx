'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewQuotationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [transportMode, setTransportMode] = useState('sea');
  
  const customers = [
    { id: '1', name: 'ABC Logistics Ltd.', contact: 'Mehmet Yılmaz' },
    { id: '2', name: 'Global Shipping Co.', contact: 'Elif Demir' },
    { id: '3', name: 'Fast Freight Ltd.', contact: 'Ali Şahin' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/quotations');
  };

  return (
    <div className="p-6 lg:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/quotations"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Create New Quotation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create a shipping quotation for a customer.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">person</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Customer</h2>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
              >
                <option value="">Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.contact}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Quote Details */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quote Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Quote Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Valid Until <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Route Details */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">route</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Route Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Origin Country <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                >
                  <option value="">Select origin...</option>
                  <option value="CN">China</option>
                  <option value="DE">Germany</option>
                  <option value="US">United States</option>
                  <option value="IT">Italy</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  POL (Port of Loading) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shanghai"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Destination Country <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                >
                  <option value="">Select destination...</option>
                  <option value="TR">Turkey</option>
                  <option value="GB">United Kingdom</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                  <option value="NL">Netherlands</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  POD (Port of Discharge) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. İstanbul-Ambarlı"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Transport Details */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Transport Details</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                  Transport Mode <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'sea', label: 'Sea', icon: 'directions_boat' },
                    { value: 'air', label: 'Air', icon: 'flight' },
                    { value: 'land', label: 'Land', icon: 'local_shipping' },
                  ].map((mode) => (
                    <label
                      key={mode.value}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                        transportMode === mode.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="transportMode"
                        value={mode.value}
                        checked={transportMode === mode.value}
                        onChange={(e) => setTransportMode(e.target.value)}
                        className="sr-only"
                      />
                      <span className="material-symbols-outlined text-[20px]">{mode.icon}</span>
                      <span className="text-sm font-medium">{mode.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                  >
                    <option value="">Select service type...</option>
                    <option value="fcl">FCL (Full Container Load)</option>
                    <option value="lcl">LCL (Less than Container Load)</option>
                    <option value="roro">Ro-Ro</option>
                    <option value="breakbulk">Break Bulk</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Incoterm <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                  >
                    <option value="">Select incoterm...</option>
                    <option value="fob">FOB</option>
                    <option value="exw">EXW</option>
                    <option value="fca">FCA</option>
                    <option value="dap">DAP</option>
                    <option value="cif">CIF</option>
                    <option value="cfr">CFR</option>
                    <option value="ddp">DDP</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">payments</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pricing</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Price Notes
                </label>
                <textarea
                  placeholder="Add any additional pricing notes or conditions here..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white resize-none"
                />
              </div>
            </div>
          </section>
        </form>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex justify-end gap-3 z-30">
        <Link
          href="/quotations"
          className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Quote
            </>
          )}
        </button>
      </div>
    </div>
  );
}
