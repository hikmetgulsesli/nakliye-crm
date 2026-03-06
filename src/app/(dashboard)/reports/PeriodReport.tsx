'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Label } from '@/components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.js';
import { Badge } from '@/components/ui/badge.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import type { PeriodReportStats, PeriodReportRow, Currency } from '@/types/index.js';

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'TRY', label: 'TRY' },
];

const STATUSES = [
  { value: 'pending', label: 'Bekliyor' },
  { value: 'won', label: 'Kazanıldı' },
  { value: 'lost', label: 'Kaybedildi' },
];

export function PeriodReport() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');
  
  const [stats, setStats] = useState<PeriodReportStats | null>(null);
  const [rows, setRows] = useState<PeriodReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(status && { status }),
        ...(currency && { currency }),
      });
      
      const res = await fetch(`/api/reports/period?${params}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      
      const data = await res.json();
      setStats(data.stats);
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, status, currency]);

  const handleExport = useCallback(async () => {
    const data = {
      title: `Dönem Raporu (${startDate} - ${endDate})`,
      headers: ['Teklif No', 'Tarih', 'Müşteri', 'Mod', 'Çıkış', 'Varış', 'Fiyat', 'Durum', 'Temsilci'],
      rows: rows.map(r => ({
        'Teklif No': r.quote_no,
        'Tarih': r.quote_date,
        'Müşteri': r.customer_name,
        'Mod': r.transport_mode || '-',
        'Çıkış': r.origin_country || '-',
        'Varış': r.destination_country || '-',
        'Fiyat': r.price ? `${r.price} ${r.currency}` : '-',
        'Durum': getStatusLabel(r.status),
        'Temsilci': r.assigned_user_name || '-',
      })),
    };
    
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'excel', data, filename: 'donem-raporu' }),
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donem-raporu-${startDate}-${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  }, [rows, startDate, endDate]);

  const handleSaveParams = useCallback(async () => {
    try {
      await fetch('/api/reports/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'period',
          name: `Dönem Raporu ${new Date().toLocaleDateString('tr-TR')}`,
          params: { startDate, endDate, status, currency },
        }),
      });
      alert('Rapor parametreleri kaydedildi');
    } catch (err) {
      console.error('Save error:', err);
    }
  }, [startDate, endDate, status, currency]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? 'Yükleniyor...' : 'Raporu Getir'}
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
              Dışa Aktar
            </Button>
            <Button variant="outline" onClick={handleSaveParams}>
              Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Toplam Teklif" value={stats.totalQuotations} />
          <StatCard title="Toplam Değer" value={`${stats.totalValue.toLocaleString('tr-TR')}`} />
          <StatCard title="Kazanılan" value={stats.wonCount} suffix={`(${stats.winRate}%)`} />
          <StatCard title="Bekleyen" value={stats.pendingCount} />
        </div>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teklif Listesi ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teklif No</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Mod</TableHead>
                    <TableHead>Çıkış → Varış</TableHead>
                    <TableHead>Fiyat</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Temsilci</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.quote_no}</TableCell>
                      <TableCell>{row.quote_date}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{row.transport_mode || '-'}</TableCell>
                      <TableCell>{row.origin_country || '-'} → {row.destination_country || '-'}</TableCell>
                      <TableCell>{row.price ? `${row.price.toLocaleString('tr-TR')} ${row.currency}` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(row.status)}>
                          {getStatusLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.assigned_user_name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, suffix }: { title: string; value: string | number; suffix?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">
          {value} {suffix && <span className="text-sm font-normal">{suffix}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Bekliyor',
    won: 'Kazanıldı',
    lost: 'Kaybedildi',
  };
  return map[status] || status;
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    won: 'default',
    lost: 'destructive',
  };
  return map[status] || 'outline';
}
