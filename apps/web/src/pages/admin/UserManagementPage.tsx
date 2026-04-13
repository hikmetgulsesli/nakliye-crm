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
      console.error('Failed to fetch users:', err);
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
    try {
      if (user.isActive) {
        await userService.deactivate(user.id);
      } else {
        await userService.update(user.id, { isActive: true });
      }
      fetchUsers();
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  }

  function handleTransfer(user: User) {
    navigate(`/devir?from=${user.id}`);
  }

  async function handleFormSubmit(data: UserCreateInput | UserUpdateInput) {
    if (editingUser) {
      await userService.update(editingUser.id, data as UserUpdateInput);
    } else {
      await userService.create(data as UserCreateInput);
    }
    fetchUsers();
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
