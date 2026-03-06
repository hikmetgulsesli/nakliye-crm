import * as React from 'react';
import { AlertTriangle, User, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomerConflict } from '@/types';

interface ConflictWarningProps {
  conflicts: CustomerConflict[];
  className?: string;
}

export function ConflictWarning({ conflicts, className }: ConflictWarningProps) {
  if (!conflicts.length) return null;

  const getMatchLabel = (field: CustomerConflict['matched_field']) => {
    switch (field) {
      case 'company_name':
        return 'Firma adı benzerliği';
      case 'phone':
        return 'Telefon eşleşmesi';
      case 'email':
        return 'E-posta eşleşmesi';
      default:
        return 'Benzer kayıt';
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/10',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Benzer Müşteri Kayıtları Tespit Edildi
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Bu bilgilerle eşleşen {conflicts.length} müşteri kaydı bulundu.
              Lütfen mevcut kayıtları kontrol edin.
            </p>
          </div>
          <div className="space-y-2">
            {conflicts.slice(0, 3).map((conflict) => (
              <div
                key={conflict.id}
                className="rounded-md bg-white/50 p-3 dark:bg-black/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">
                    {conflict.company_name}
                  </span>
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                    {getMatchLabel(conflict.matched_field)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-yellow-700 dark:text-yellow-300">
                  {conflict.contact_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {conflict.contact_name}
                    </span>
                  )}
                  {conflict.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {conflict.phone}
                    </span>
                  )}
                  {conflict.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {conflict.email}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {conflicts.length > 3 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ve {conflicts.length - 3} kayıt daha...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
