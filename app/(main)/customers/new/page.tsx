'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    transportModes: [] as string[],
    serviceTypes: [] as string[],
    incoterms: [] as string[],
    direction: {
      import: false,
      export: false,
    },
    originCountries: '',
    destinationCountries: '',
    source: 'referral',
    potential: 'medium',
    status: 'active',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/customers');
  };

  const handleChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTransportMode = (mode: string) => {
    setFormData(prev => ({
      ...prev,
      transportModes: prev.transportModes.includes(mode)
        ? prev.transportModes.filter(m => m !== mode)
        : [...prev.transportModes, mode]
    }));
  };

  return (
    <div className="p-6 lg:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/customers"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Add New Customer
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create a new customer record with shipping preferences.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">corporate_fare</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Company / Firm Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  placeholder="Enter primary contact name"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+90 532 123 4567"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Street address, City, Country"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Shipping Preferences */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">directions_boat</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Shipping Preferences</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                  Transport Mode
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Sea', 'Air', 'Land', 'Multimodal'].map((mode) => (
                    <label
                      key={mode}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        formData.transportModes.includes(mode)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.transportModes.includes(mode)}
                        onChange={() => toggleTransportMode(mode)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Origin Countries
                  </label>
                  <input
                    type="text"
                    value={formData.originCountries}
                    onChange={(e) => handleChange('originCountries', e.target.value)}
                    placeholder="e.g. China, Germany, USA"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Destination Countries
                  </label>
                  <input
                    type="text"
                    value={formData.destinationCountries}
                    onChange={(e) => handleChange('destinationCountries', e.target.value)}
                    placeholder="e.g. Turkey, UK, Australia"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                  Direction
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.direction.import}
                      onChange={(e) => setFormData(prev => ({ ...prev, direction: { ...prev.direction, import: e.target.checked } }))}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Import</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.direction.export}
                      onChange={(e) => setFormData(prev => ({ ...prev, direction: { ...prev.direction, export: e.target.checked } }))}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Export</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* CRM Information */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">analytics</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">CRM Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                >
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="trade_show">Trade Show</option>
                  <option value="digital">Digital</option>
                  <option value="existing">Existing Customer</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Potential
                </label>
                <select
                  value={formData.potential}
                  onChange={(e) => handleChange('potential', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="passive">Passive</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Add any specific requirements, pain points, or historical context here..."
                  rows={4}
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
          href="/customers"
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
              Save Customer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
