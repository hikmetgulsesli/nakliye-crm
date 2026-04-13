import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';

interface CategoryItem {
  key: string;
  label: string;
  count: number;
}

interface LookupCategorySidebarProps {
  categories: CategoryItem[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export function LookupCategorySidebar({
  categories,
  activeCategory,
  onSelect,
}: LookupCategorySidebarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icon name="list" size="sm" className="text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Kategoriler
          </h3>
        </div>
      </div>

      {/* Category list */}
      <nav className="py-2">
        {categories.map((cat) => {
          const isActive = cat.key === activeCategory;
          return (
            <button
              key={cat.key}
              onClick={() => onSelect(cat.key)}
              className={cn(
                'w-full flex items-center justify-between px-5 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <span className="truncate">{cat.label}</span>
              <span
                className={cn(
                  'flex-shrink-0 ml-2 text-xs font-bold rounded-full px-2 py-0.5',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500',
                )}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
