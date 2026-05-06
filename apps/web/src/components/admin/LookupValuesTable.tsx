import { cn } from '@/utils/cn';
import { Badge, Icon } from '@/components/ui';
import type { LookupValue } from '@nakliye-crm/shared';

interface LookupValuesTableProps {
  values: LookupValue[];
  categoryLabel: string;
  categoryDescription?: string;
  loading?: boolean;
  onAdd: () => void;
  onEdit: (item: LookupValue) => void;
  onDelete: (item: LookupValue) => void;
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragEnd?: () => void;
}

export function LookupValuesTable({
  values,
  categoryLabel,
  categoryDescription,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: LookupValuesTableProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <div className="h-5 bg-slate-200 rounded w-48 mb-2" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-64" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="h-4 bg-slate-200 rounded w-6" />
              <div className="h-4 bg-slate-200 rounded w-8" />
              <div className="flex-1 h-4 bg-slate-200 rounded w-32" />
              <div className="h-6 bg-slate-200 rounded-full w-14" />
              <div className="h-4 bg-slate-200 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{categoryLabel}</h3>
          {categoryDescription && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{categoryDescription}</p>
          )}
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 text-sm transition-colors"
        >
          <Icon name="add" size="sm" />
          Yeni Değer Ekle
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              <th className="w-10" />
              <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-4 py-3 text-left font-semibold w-16">
                Sira
              </th>
              <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-3 text-left font-semibold">
                Deger
              </th>
              <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-3 text-left font-semibold">
                Durum
              </th>
              <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-3 text-center font-semibold">
                Kullanan Kayıt
              </th>
              <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-3 text-center font-semibold w-24">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {values.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                  Bu kategoride henuz deger bulunmuyor
                </td>
              </tr>
            ) : (
              values.map((item, index) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={() => onDragStart?.(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    onDragOver?.(index);
                  }}
                  onDragEnd={() => onDragEnd?.()}
                  className={cn(
                    'hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60 transition-colors group',
                    !item.isActive && 'opacity-50',
                  )}
                >
                  {/* Drag handle */}
                  <td className="pl-4 py-4">
                    <span className="text-slate-300 group-hover:text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing">
                      <Icon name="drag_indicator" size="sm" />
                    </span>
                  </td>

                  {/* SIRA */}
                  <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {item.sortOrder}
                  </td>

                  {/* DEGER */}
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.value}
                  </td>

                  {/* DURUM */}
                  <td className="px-6 py-4">
                    <Badge
                      variant={item.isActive ? 'success' : 'danger'}
                      size="sm"
                    >
                      {item.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>

                  {/* KULLANAN KAYIT */}
                  <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-300">
                    {(item as unknown as Record<string, unknown>).usageCount as React.ReactNode ?? 0}
                  </td>

                  {/* ISLEMLER */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-blue-50 transition-colors"
                        title="Düzenle"
                      >
                        <Icon name="edit" size="sm" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <Icon name="delete" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
