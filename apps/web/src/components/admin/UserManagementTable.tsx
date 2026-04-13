import { Avatar, Badge, Icon } from '@/components/ui';
import type { User } from '@nakliye-crm/shared';

interface UserManagementTableProps {
  data: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onTransfer: (user: User) => void;
}

export function UserManagementTable({
  data,
  loading,
  onEdit,
  onToggleStatus,
  onTransfer,
}: UserManagementTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-slate-50 h-12" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
              <div className="size-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-20" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-48" />
              <div className="h-6 bg-slate-200 rounded-full w-16" />
              <div className="h-4 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <Icon name="group" size="xl" className="text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm">Kullanici bulunamadi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-slate-500 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                Kullanici
              </th>
              <th className="text-slate-500 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                E-posta
              </th>
              <th className="text-slate-500 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                Rol
              </th>
              <th className="text-slate-500 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                Durum
              </th>
              <th className="text-slate-500 text-xs uppercase tracking-wider px-6 py-4 text-center font-semibold">
                Musteri
              </th>
              <th className="text-slate-500 text-xs uppercase tracking-wider px-6 py-4 text-center font-semibold">
                Teklif
              </th>
              <th className="text-slate-500 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                Son Giris
              </th>
              <th className="text-slate-500 text-xs uppercase tracking-wider px-6 py-4 text-center font-semibold">
                Islemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                {/* KULLANICI */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.avatarUrl}
                      name={user.fullName}
                      size="md"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.role === 'ADMIN' ? 'Yonetici' : 'Satis Temsilcisi'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* E-POSTA */}
                <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>

                {/* ROL */}
                <td className="px-6 py-4">
                  <Badge
                    variant={user.role === 'ADMIN' ? 'info' : 'neutral'}
                    size="sm"
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Kullanici'}
                  </Badge>
                </td>

                {/* DURUM */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        user.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        user.isActive ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {user.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </td>

                {/* MUSTERI count */}
                <td className="px-6 py-4 text-center text-sm text-slate-700 font-medium">
                  {((user as unknown as Record<string, unknown>).customerCount as React.ReactNode) ?? '-'}
                </td>

                {/* TEKLIF count */}
                <td className="px-6 py-4 text-center text-sm text-slate-700 font-medium">
                  {((user as unknown as Record<string, unknown>).quoteCount as React.ReactNode) ?? '-'}
                </td>

                {/* SON GIRIS */}
                <td className="px-6 py-4 text-sm text-slate-500">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </td>

                {/* ISLEMLER */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-blue-50 transition-colors"
                      title="Duzenle"
                    >
                      <Icon name="edit" size="sm" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(user)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.isActive
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={user.isActive ? 'Pasife Al' : 'Aktif Et'}
                    >
                      <Icon
                        name={user.isActive ? 'toggle_on' : 'toggle_off'}
                        size="sm"
                      />
                    </button>
                    <button
                      onClick={() => onTransfer(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Devret"
                    >
                      <Icon name="swap_horiz" size="sm" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
