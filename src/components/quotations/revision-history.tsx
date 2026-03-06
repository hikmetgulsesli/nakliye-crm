'use client';

import * as React from 'react';
import { Clock, User } from 'lucide-react';
import type { QuotationRevisionWithUser } from '@/types/quotations';

interface RevisionHistoryProps {
  revisions: QuotationRevisionWithUser[];
}

export function RevisionHistory({ revisions }: RevisionHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const formatFieldName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      customer_id: 'Müşteri',
      quote_date: 'Teklif Tarihi',
      validity_date: 'Geçerlilik Tarihi',
      transport_mode: 'Taşıma Modu',
      service_type: 'Servis Tipi',
      origin_country: 'Çıkış Ülkesi',
      destination_country: 'Varış Ülkesi',
      pol: 'Yükleme Noktası',
      pod: 'Varış Noktası',
      incoterm: 'Satış Şekli',
      price: 'Fiyat',
      currency: 'Para Birimi',
      status: 'Durum',
      loss_reason: 'Kaybedilme Nedeni',
      assigned_user_id: 'Atanan Temsilci',
    };
    return fieldNames[field] || field;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
    return String(value);
  };

  if (revisions.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Henüz revizyon kaydı bulunmamaktadır.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {revisions.map((revision) => (
        <div
          key={revision.id}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Rev. {revision.revision_no}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDate(revision.revised_at)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {revision.revised_by_user?.full_name || 'Bilinmiyor'}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {revision.changed_fields.map((change, index) => (
              <div
                key={index}
                className="grid grid-cols-[120px_1fr_1fr] items-center gap-2 text-sm"
              >
                <span className="font-medium text-muted-foreground">
                  {formatFieldName(change.field)}:
                </span>
                <span className="rounded bg-red-50 px-2 py-1 text-red-700 line-through">
                  {formatValue(change.old_value)}
                </span>
                <span className="rounded bg-green-50 px-2 py-1 text-green-700">
                  {formatValue(change.new_value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
