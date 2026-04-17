import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { ConflictWarningModal } from '@/components/customers/ConflictWarningModal';
import { customerService, type ConflictMatch } from '@/services/customer.service';
import { userService } from '@/services/user.service';
import type { CustomerCreateInput } from '@nakliye-crm/shared';

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMatches, setConflictMatches] = useState<ConflictMatch[]>([]);
  const [pendingData, setPendingData] = useState<CustomerCreateInput | null>(null);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

  // Fetch users for the form
  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await userService.getAll(1, 100);
        setUsers(
          result.data
            .filter((u) => u.isActive)
            .map((u) => ({
              value: u.id.toString(),
              label: u.fullName,
            })),
        );
      } catch (err) {
        setConflictWarning('Kullanıcı listesi yüklenirken bir hata oluştu.');
      }
    }
    fetchUsers();
  }, []);

  async function handleSubmit(data: CustomerCreateInput) {
    setLoading(true);
    setConflictWarning(null);

    try {
      // First, check for conflicts
      const conflictResult = await customerService.conflictCheck(
        data.phone,
        data.email,
        data.companyName,
      );

      if (conflictResult.length > 0 && !data.forceCreate) {
        // Show conflict modal
        setConflictMatches(conflictResult);
        setPendingData(data);
        setShowConflictModal(true);
        setConflictWarning('Bu telefon numarasi başka bir kayitta kullaniliyor');
        setLoading(false);
        return;
      }

      // No conflict or force create - proceed
      const customer = await customerService.create(data);
      navigate(`/musteriler/${customer.id}`);
    } catch (err: unknown) {
      setConflictWarning('Müşteri oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForceCreate() {
    if (!pendingData) return;
    setLoading(true);
    try {
      const customer = await customerService.create({
        ...pendingData,
        forceCreate: true,
      });
      setShowConflictModal(false);
      navigate(`/musteriler/${customer.id}`);
    } catch (err) {
      setConflictWarning('Müşteri oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Müşteriler', href: '/musteriler' },
          { label: 'Yeni Müşteri Ekle' },
        ]}
        title="Yeni Müşteri Ekle"
      />

      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/musteriler')}
        loading={loading}
        conflictWarning={conflictWarning}
        users={users}
      />

      <ConflictWarningModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onForceCreate={handleForceCreate}
        matches={conflictMatches}
        loading={loading}
      />
    </div>
  );
}
