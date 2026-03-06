'use client';

import * as React from 'react';
import { Clock, User } from 'lucide-react';
import type { AuditLogWithUser } from '@/types';

interface AuditHistoryProps {
  logs: AuditLogWithUser[];
}

export function AuditHistory({ logs }: AuditHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Henüz kayıt bulunmuyor.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Oluşturma',
      update: 'Güncelleme',
      delete: 'Silme',
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="border rounded-lg p-4 bg-gray-50"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{log.user.full_name}</span>
              <span className="text-sm text-gray-600">
                {getActionLabel(log.action)} işlemi yaptı
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-3 h-3" />
              {formatDate(log.created_at)}
            </div>
          </div>
          
          {log.changes && Object.keys(log.changes).length > 0 && (
            <div className="mt-3 pl-6 text-sm">
              <p className="text-gray-600 font-medium mb-1">Değişiklikler:</p>
              <ul className="space-y-1">
                {Object.entries(log.changes).map(([field, change]) => (
                  <li key={field} className="text-gray-600">
                    <span className="font-medium">{field}:</span>{' '}
                    <span className="text-red-600 line-through">
                      {String(change.old ?? '-')}
                    </span>{' '}
                    →{' '}
                    <span className="text-green-600">
                      {String(change.new ?? '-')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
