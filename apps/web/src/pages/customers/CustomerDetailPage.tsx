import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Icon, Modal, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CustomerDetailTabs } from '@/components/customers/CustomerDetailTabs';
import { DocumentsPanel } from '@/components/documents/DocumentsPanel';
import { CustomerTimeline } from '@/components/customers/CustomerTimeline';
import { ContactsPanel } from '@/components/customers/ContactsPanel';
import { InternalNotesPanel } from '@/components/notes/InternalNotesPanel';
import { FeatureGate } from '@/components/features/FeatureGate';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@nakliye-crm/shared';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteFocusSignal, setNoteFocusSignal] = useState<number | undefined>(undefined);

  // Hash veya buton tetiklemesinde "İç Notlar"a kaydir + textarea odakla
  function focusInternalNotes() {
    const el = document.getElementById('internal-notes');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setNoteFocusSignal((n) => (n ?? 0) + 1);
  }

  // URL hash #internal-notes ise ayni akisi tetikle (ornegin global search'ten gelis)
  useEffect(() => {
    if (!customer) return;
    if (location.hash === '#internal-notes') {
      const t = window.setTimeout(focusInternalNotes, 100);
      return () => window.clearTimeout(t);
    }
  }, [customer, location.hash]);

  useEffect(() => {
    async function fetchCustomer() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await customerService.getById(Number(id));
        setCustomer(data);
      } catch (err) {
        setError('Müşteri bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id, navigate]);

  async function handleDelete() {
    if (!customer) return;

    setDeleting(true);
    try {
      await customerService.delete(customer.id);
      navigate('/musteriler');
    } catch (err) {
      setError('Müşteri silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-4 w-64 rounded mb-3" />
          <Skeleton className="h-8 w-48 rounded" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        <p className="text-slate-600 dark:text-slate-300">{error}</p>
        <button
          onClick={() => navigate('/musteriler')}
          className="text-sm text-primary hover:underline"
        >
          Müşteri listesine don
        </button>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Müşteriler', href: '/musteriler' },
          { label: customer.companyName },
        ]}
        title={customer.companyName}
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Company header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Company icon */}
          <div className="flex items-center justify-center size-16 rounded-xl bg-primary/10 text-primary flex-shrink-0">
            <Icon name="business" size="lg" />
          </div>

          {/* Company info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={customer.status} />
              {customer.potential && (
                <StatusBadge status={customer.potential} />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              {customer.assignedUser && (
                <span className="flex items-center gap-1.5">
                  <Icon name="person" size="sm" className="text-slate-400 dark:text-slate-500" />
                  Temsilci: <span className="text-slate-700 dark:text-slate-300 font-medium">{customer.assignedUser.fullName}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Icon name="phone" size="sm" className="text-slate-400 dark:text-slate-500" />
                Son İletişim: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(customer.lastContactDate)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="request_quote" size="sm" className="text-slate-400 dark:text-slate-500" />
                Son Teklif: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(customer.lastQuoteDate)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="primary"
              icon="edit_note"
              onClick={focusInternalNotes}
              className="!bg-blue-500 hover:!bg-blue-600 !text-white !shadow-blue-500/20"
            >
              Not Ekle
            </Button>
            <Button
              variant="secondary"
              icon="edit"
              onClick={() => navigate(`/musteriler/${customer.id}/duzenle`)}
            >
              Düzenle
            </Button>
            <Button
              variant="danger"
              icon="delete"
              onClick={() => setShowDeleteModal(true)}
              loading={deleting}
            >
              Sil
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <CustomerDetailTabs customer={customer} />

      {/* Yetkili Contacts */}
      <FeatureGate feature="customer_contacts">
        <div className="mt-6">
          <ContactsPanel customerId={customer.id} />
        </div>
      </FeatureGate>

      {/* Internal notes — once geliyor cunku gunluk operasyonda en sik kullanilan */}
      <FeatureGate feature="internal_notes">
        <div id="internal-notes" className="mt-6 scroll-mt-24">
          <InternalNotesPanel
            ownerType="customer"
            ownerId={customer.id}
            focusSignal={noteFocusSignal}
          />
        </div>
      </FeatureGate>

      {/* Documents */}
      <FeatureGate feature="documents">
        <div className="mt-6">
          <DocumentsPanel ownerType="customer" ownerId={customer.id} />
        </div>
      </FeatureGate>

      {/* Unified timeline */}
      <FeatureGate feature="customer_timeline">
        <div className="mt-6">
          <CustomerTimeline customerId={customer.id} />
        </div>
      </FeatureGate>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Musteriyi Sil"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              İptal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Sil
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Bu musteriyi silmek istediginize emin misiniz? Bu işlem geri alinabilir.
        </p>
      </Modal>
    </div>
  );
}
