'use client';

import { useState } from 'react';
import { useLookupValues, LookupValue, LookupValueInput } from '@/lib/hooks/useLookupValues';
import { MetadataSidebar } from '@/components/admin/MetadataSidebar';
import { MetadataTable } from '@/components/admin/MetadataTable';
import { EditValueModal } from '@/components/admin/EditValueModal';
import { AddValueModal } from '@/components/admin/AddValueModal';

const CATEGORY_LABELS: Record<string, string> = {
  transport_mode: 'Transport Mode',
  service_type: 'Service Type',
  incoterm: 'Incoterm',
  source: 'Source',
  potential: 'Potential',
  customer_status: 'Customer Status',
  quotation_status: 'Quotation Status',
  loss_reason: 'Loss Reason',
  currency: 'Currency',
  port: 'Port',
  country: 'Country',
  package_type: 'Package Type',
  cargo_type: 'Cargo Type',
  status_code: 'Status Code',
  region: 'Region',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  transport_mode: 'Manage transport modes available for shipments and quotations.',
  service_type: 'Manage service types offered to customers.',
  incoterm: 'Manage Incoterms used in international trade.',
  source: 'Manage lead source categories.',
  potential: 'Manage customer potential levels.',
  customer_status: 'Manage customer status values.',
  quotation_status: 'Manage quotation status values.',
  loss_reason: 'Manage reasons for lost quotations.',
  currency: 'Manage available currencies.',
  port: 'Manage port locations.',
  country: 'Manage country list.',
  package_type: 'Manage package types.',
  cargo_type: 'Manage cargo types.',
  status_code: 'Manage system status codes.',
  region: 'Manage geographic regions.',
};

export default function MetadataPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('transport_mode');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<LookupValue | null>(null);

  const {
    lookupValues,
    isLoading,
    error,
    createLookupValue,
    updateLookupValue,
    deleteLookupValue,
    activateLookupValue,
    deactivateLookupValue,
  } = useLookupValues({
    category: selectedCategory,
    search: searchQuery || undefined,
  });

  const handleAddValue = async (data: LookupValueInput) => {
    await createLookupValue({ ...data, category: selectedCategory });
    setIsAddModalOpen(false);
  };

  const handleEditValue = async (id: string, data: Partial<LookupValueInput>) => {
    await updateLookupValue(id, data);
    setEditingValue(null);
  };

  const handleDeleteValue = async (id: string) => {
    if (confirm('Are you sure you want to delete this value?')) {
      await deleteLookupValue(id);
    }
  };

  const handleToggleStatus = async (value: LookupValue) => {
    if (value.isActive) {
      await deactivateLookupValue(value.id);
    } else {
      await activateLookupValue(value.id);
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-slate-50 dark:bg-[#0b131a]">
      <MetadataSidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-slate-900 dark:text-white text-2xl sm:text-3xl font-bold leading-tight font-display">
                {CATEGORY_LABELS[selectedCategory] || selectedCategory}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {CATEGORY_DESCRIPTIONS[selectedCategory] || `Manage ${selectedCategory} values.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-sm transition-colors w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add New Value
              </button>
            </div>
          </div>

          {/* Table */}
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              Error: {error}
            </div>
          ) : (
            <MetadataTable
              values={lookupValues}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onEdit={setEditingValue}
              onDelete={handleDeleteValue}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </div>
      </main>

      {/* Add Modal */}
      {isAddModalOpen && (
        <AddValueModal
          category={selectedCategory}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddValue}
        />
      )}

      {/* Edit Modal */}
      {editingValue && (
        <EditValueModal
          value={editingValue}
          onClose={() => setEditingValue(null)}
          onSave={handleEditValue}
        />
      )}
    </div>
  );
}
