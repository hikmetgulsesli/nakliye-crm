'use client';

import * as React from 'react';
import { UserPlus, Edit, Trash2, ArrowRightLeft, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditLogWithUser, AuditAction } from '@/types/index.js';

interface AuditHistoryProps {
  logs: AuditLogWithUser[];
  loading?: boolean;
}

const actionIcons: Record<AuditAction, typeof UserPlus> = {
  create: UserPlus,
  update: Edit,
  delete: Trash2,
  assign: ArrowRightLeft,
  force_create: AlertTriangle,
};

const actionLabels: Record<AuditAction, string> = {
  create: 'Oluşturuldu',
  update: 'Güncellendi',
  delete: 'Silindi',
  assign: 'Atama yapıldı',
  force_create: 'Zorla kaydedildi',
};

const actionColors: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  assign: 'bg-purple-100 text-purple-800',
  force_create: 'bg-orange-100 text-orange-800',
};

function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    company_name: 'Firma Adı',
    contact_name: 'Yetkili Adı',
    phone: 'Telefon',
    email: 'E-posta',
    address: 'Adres',
    transport_modes: 'Taşıma Modu',
    service_types: 'Servis Tipi',
    incoterms: 'Incoterm',
    direction: 'İşlem Yönü',
    origin_countries: 'Çıkış Ülkeleri',
    destination_countries: 'Varış Ülkeleri',
    source: 'Kaynak',
    potential: 'Potansiyel',
    status: 'Durum',
    assigned_user_id: 'Atanan Temsilci',
    notes: 'Notlar',
    type: 'Aktivite Tipi',
    date: 'Tarih',
    duration: 'Süre',
    outcome: 'Sonuç',
    next_action_date: 'Sonraki Aksiyon',
    price: 'Fiyat',
    currency: 'Para Birimi',
    quote_no: 'Teklif No',
  };
  return fieldNames[field] || field;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  if (Array.isArray(value)) return value.join(', ') || '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface AuditLogItemProps {
  log: AuditLogWithUser;
}

function AuditLogItem({ log }: AuditLogItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const IconComponent = actionIcons[log.action];
  const hasChanges = log.changes && Object.keys(log.changes).length > 0;

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${actionColors[log.action]}`}>
          <IconComponent className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{actionLabels[log.action]}</span>
            <span className="text-sm text-slate-500">
              {log.user.full_name} tarafından
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {new Date(log.created_at).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {hasChanges && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Değişiklikleri gizle
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Değişiklikleri gör
                </>
              )}
            </button>
          )}

          {isExpanded && hasChanges && (
            <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-3">
              {Object.entries(log.changes!).map(([field, change]) => (
                <div key={field} className="text-sm">
                  <span className="font-medium text-slate-700">
                    {formatFieldName(field)}:
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-slate-500 line-through">
                      {formatValue(change.old)}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="font-medium text-green-600">
                      {formatValue(change.new)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {log.metadata && log.action === 'delete' && (
            <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <span className="font-medium">Silinen kayıt bilgileri:</span>
              <pre className="mt-1 overflow-x-auto text-xs">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditHistory({ logs, loading }: AuditHistoryProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">Kayıt bulunamadı</h3>
        <p className="mt-2 text-sm text-slate-600">
          Bu kayıt için henüz bir işlem geçmişi bulunmuyor.
        </p>
      </div>
    );
  }

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.created_at).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, AuditLogWithUser[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedLogs).map(([date, dateLogs]) => (
        <div key={date}>
          <h4 className="mb-3 text-sm font-medium text-slate-500">{date}</h4>
          <div className="space-y-3">
            {dateLogs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}