'use client';

import { useState } from 'react';
import { useUsers, User } from '@/lib/hooks/useUsers';
import { UserTable } from '@/components/admin/UserTable';
import { AddUserModal } from '@/components/admin/AddUserModal';
import { EditUserModal } from '@/components/admin/EditUserModal';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { users, isLoading, error, createUser, updateUser, toggleUserStatus } = useUsers({
    search: searchQuery,
    role: roleFilter,
    status: 'all',
  });

  const handleAddUser = async (data: Parameters<typeof createUser>[0]) => {
    await createUser(data);
    setIsAddModalOpen(false);
  };

  const handleEditUser = async (id: string, data: Parameters<typeof updateUser>[1]) => {
    await updateUser(id, data);
    setEditingUser(null);
  };

  const handleToggleStatus = async (user: User) => {
    if (confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.firstName} ${user.lastName}?`)) {
      await toggleUserStatus(user.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage team members, roles, and access across the CRM.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add User
        </button>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-700 dark:text-red-400">
          Error: {error}
        </div>
      )}

      {/* Table */}
      <UserTable
        users={users}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onEdit={setEditingUser}
        onToggleStatus={handleToggleStatus}
      />

      {/* Add Modal */}
      {isAddModalOpen && (
        <AddUserModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddUser}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditUser}
        />
      )}
    </div>
  );
}
