import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, SearchInput, Pagination } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { UserForm } from '@/components/admin/UserForm';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { User, UserCreateInput, UserUpdateInput } from '@nakliye-crm/shared';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { page, pageSize, totalPages, total, setPage, setTotal } = usePagination();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userService.getAll(page, pageSize);
      // Client-side search filter (backend may also support it)
      let filtered = result.data;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q),
        );
      }
      setUsers(filtered);
      setTotal(result.total);
    } catch (err) {
      setError('Kullanicilar yuklenirken bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, setTotal]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleEdit(user: User) {
    setEditingUser(user);
    setFormOpen(true);
  }

  function handleCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  async function handleToggleStatus(user: User) {
    setError(null);
    try {
      if (user.isActive) {
        await userService.deactivate(user.id);
      } else {
        await userService.update(user.id, { isActive: true });
      }
      fetchUsers();
    } catch (err) {
      setError('Kullanici durumu degistirilirken bir hata olustu.');
    }
  }

  function handleTransfer(user: User) {
    navigate(`/devir?from=${user.id}`);
  }

  async function handleFormSubmit(data: UserCreateInput | UserUpdateInput) {
    setError(null);
    try {
      if (editingUser) {
        await userService.update(editingUser.id, data as UserUpdateInput);
      } else {
        await userService.create(data as UserCreateInput);
      }
      fetchUsers();
    } catch (err) {
      setError('Kullanici kaydedilirken bir hata olustu. Lutfen tekrar deneyin.');
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Kullanici Yonetimi' },
        ]}
        title="Kullanici Yonetimi"
        subtitle="Sistem kullanicilarini yonetin ve yetkilendirin"
        action={
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kullanici ara..."
              className="w-64"
            />
            <Button icon="person_add" onClick={handleCreate}>
              Yeni Kullanici
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {!loading && users.length === 0 ? (
        <EmptyState
          icon="group"
          title="Henuz kullanici eklenmemis"
          description="Sisteme yeni kullanici ekleyerek baslayabilirsiniz."
          action={
            <Button icon="person_add" onClick={handleCreate}>
              Yeni Kullanici Ekle
            </Button>
          }
        />
      ) : (
        <>
          <UserManagementTable
            data={users}
            loading={loading}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onTransfer={handleTransfer}
          />

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* User Form Modal */}
      <UserForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        user={editingUser}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
