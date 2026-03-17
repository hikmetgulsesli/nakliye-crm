'use client';

import { useState } from 'react';
import { UserInput } from '@/lib/hooks/useUsers';

interface AddUserModalProps {
  onClose: () => void;
  onSave: (data: UserInput) => Promise<void>;
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SALES_REP', label: 'Sales Representative' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'VIEWER', label: 'Viewer' },
];

export function AddUserModal({ onClose, onSave }: AddUserModalProps) {
  const [formData, setFormData] = useState<UserInput>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'SALES_REP',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof UserInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Add New User
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100"
                placeholder="e.g. Ahmet"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100"
                placeholder="e.g. Yılmaz"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100"
              placeholder="e.g. ahmet.yilmaz@reelforge.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100"
              placeholder="Min 8 characters"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100 appearance-none"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100"
                placeholder="e.g. +90 532 123 4567"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
              )}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
