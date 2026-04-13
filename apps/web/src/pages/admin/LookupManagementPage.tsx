import { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LookupCategorySidebar } from '@/components/admin/LookupCategorySidebar';
import { LookupValuesTable } from '@/components/admin/LookupValuesTable';
import { LookupValueForm } from '@/components/admin/LookupValueForm';
import { lookupService, type LookupUpdateInput } from '@/services/lookup.service';
import { LOOKUP_CATEGORY_LABELS } from '@nakliye-crm/shared';
import type { LookupValue, LookupCreateInput } from '@nakliye-crm/shared';

export default function LookupManagementPage() {
  const [allValues, setAllValues] = useState<LookupValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('transport_mode');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupValue | null>(null);

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const fetchLookups = useCallback(async () => {
    setLoading(true);
    try {
      const grouped = await lookupService.getAll();
      // Flatten grouped Record<string, LookupValue[]> into single array
      const flat: LookupValue[] = [];
      for (const category of Object.keys(grouped || {})) {
        flat.push(...grouped[category]);
      }
      setAllValues(flat);
    } catch (err) {
      console.error('Failed to fetch lookups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  // Group by category
  const categoryCounts: Record<string, number> = {};
  for (const item of allValues) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  const categories = Object.entries(LOOKUP_CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    count: categoryCounts[key] || 0,
  }));

  const currentValues = allValues
    .filter((v) => v.category === activeCategory)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const categoryLabel = LOOKUP_CATEGORY_LABELS[activeCategory] || activeCategory;

  function handleAdd() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function handleEdit(item: LookupValue) {
    setEditingItem(item);
    setFormOpen(true);
  }

  async function handleDelete(item: LookupValue) {
    if (!confirm(`"${item.value}" degerini silmek istediginize emin misiniz?`)) return;
    try {
      await lookupService.toggle(item.id);
      fetchLookups();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  async function handleFormSubmit(data: LookupCreateInput | LookupUpdateInput) {
    if (editingItem) {
      await lookupService.update(editingItem.id, data as LookupUpdateInput);
    } else {
      await lookupService.create(data as LookupCreateInput);
    }
    fetchLookups();
  }

  // Drag handlers
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(index: number) {
    dragOverIndex.current = index;
  }

  async function handleDragEnd() {
    if (dragIndex.current === null || dragOverIndex.current === null) return;
    if (dragIndex.current === dragOverIndex.current) {
      dragIndex.current = null;
      dragOverIndex.current = null;
      return;
    }

    const items = [...currentValues];
    const [removed] = items.splice(dragIndex.current, 1);
    items.splice(dragOverIndex.current, 0, removed);

    const reorderItems = items.map((item, idx) => ({
      id: item.id,
      sortOrder: idx + 1,
    }));

    dragIndex.current = null;
    dragOverIndex.current = null;

    try {
      await lookupService.reorder(reorderItems);
      fetchLookups();
    } catch (err) {
      console.error('Reorder error:', err);
    }
  }

  const nextSortOrder = currentValues.length > 0
    ? Math.max(...currentValues.map((v) => v.sortOrder)) + 1
    : 1;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Liste Yonetimi' },
        ]}
        title="Dinamik Liste Yonetimi"
        subtitle="Sistem genelinde kullanilan liste degerlerini yonetin"
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar - Categories */}
        <div className="col-span-12 lg:col-span-3">
          <LookupCategorySidebar
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* Right panel - Values */}
        <div className="col-span-12 lg:col-span-9">
          <LookupValuesTable
            values={currentValues}
            categoryLabel={categoryLabel}
            categoryDescription={`"${categoryLabel}" kategorisine ait tum degerler`}
            loading={loading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>

      {/* Form Modal */}
      <LookupValueForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        item={editingItem}
        category={activeCategory}
        categoryLabel={categoryLabel}
        nextSortOrder={nextSortOrder}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
