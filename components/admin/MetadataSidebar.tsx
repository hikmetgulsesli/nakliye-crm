'use client';

import { useLookupCategories } from '@/lib/hooks/useLookupValues';

interface MetadataSidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const ICONS: Record<string, string> = {
  transport_mode: 'local_shipping',
  service_type: 'design_services',
  incoterm: 'description',
  source: 'source',
  potential: 'trending_up',
  customer_status: 'group',
  quotation_status: 'request_quote',
  loss_reason: 'money_off',
  currency: 'payments',
  port: 'anchor',
  country: 'public',
  package_type: 'inventory_2',
  cargo_type: 'box',
  status_code: 'checklist',
  region: 'public',
};

const DEFAULT_CATEGORIES = [
  'transport_mode',
  'service_type',
  'incoterm',
  'source',
  'potential',
  'customer_status',
  'quotation_status',
  'loss_reason',
  'currency',
  'port',
  'country',
];

export function MetadataSidebar({ selectedCategory, onSelectCategory }: MetadataSidebarProps) {
  const { categories: dynamicCategories, isLoading } = useLookupCategories();

  // Merge default categories with dynamic ones, ensuring no duplicates
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...dynamicCategories]));

  const formatLabel = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 overflow-y-auto hidden md:block">
      <div className="p-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 font-display">
          CRM Metadata
        </h3>
        <nav className="space-y-1">
          {isLoading ? (
            <div className="text-sm text-slate-400 py-2">Loading...</div>
          ) : (
            allCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {ICONS[category] || 'label'}
                </span>
                {formatLabel(category)}
              </button>
            ))
          )}
        </nav>
      </div>
    </aside>
  );
}
