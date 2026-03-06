'use client';

import * as React from 'react';
import { Loader2, ArrowRight, Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { User, TransferScope, TransferPreview, BulkTransferResult } from '@/types';

interface BulkTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
}

export function BulkTransferModal({ isOpen, onClose, users }: BulkTransferModalProps) {
  const [step, setStep] = React.useState<'select' | 'preview' | 'confirm' | 'result'>('select');
  const [sourceUserId, setSourceUserId] = React.useState('');
  const [targetUserId, setTargetUserId] = React.useState('');
  const [scope, setScope] = React.useState<TransferScope>('all');
  const [reason, setReason] = React.useState('');
  const [deactivateSource, setDeactivateSource] = React.useState(false);
  const [preview, setPreview] = React.useState<TransferPreview | null>(null);
  const [result, setResult] = React.useState<BulkTransferResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSourceUserId('');
      setTargetUserId('');
      setScope('all');
      setReason('');
      setDeactivateSource(false);
      setPreview(null);
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const activeUsers = users.filter((u) => u.is_active);

  const handlePreview = async () => {
    if (!sourceUserId || !targetUserId) {
      setError('Kaynak ve hedef temsilci seçiniz');
      return;
    }
    if (sourceUserId === targetUserId) {
      setError('Kaynak ve hedef temsilci aynı olamaz');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          source_user_id: sourceUserId,
          target_user_id: targetUserId,
          scope,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Önizleme alınamadı');
      }

      setPreview(data.data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!reason.trim()) {
      setError('Devir sebebini giriniz');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-transfer',
          source_user_id: sourceUserId,
          target_user_id: targetUserId,
          scope,
          reason: reason.trim(),
          deactivate_source: deactivateSource,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Devir işlemi başarısız');
      }

      setResult(data.data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Toplu Temsilci Devir İşlemi</DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Kaynak ve hedef temsilciyi seçiniz'}
            {step === 'preview' && 'Devir işlemi önizlemesi'}
            {step === 'confirm' && 'Devir işlemini onaylayınız'}
            {step === 'result' && 'İşlem tamamlandı'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source">Devreden Temsilci</Label>
              <Select value={sourceUserId} onValueChange={setSourceUserId}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Temsilci seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Devralan Temsilci</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger id="target">
                  <SelectValue placeholder="Temsilci seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kapsam</Label>
              <Select value={scope} onValueChange={(value) => setScope(value as TransferScope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Müşteri ve Teklifler</SelectItem>
                  <SelectItem value="active_customers">Sadece Aktif Müşteriler</SelectItem>
                  <SelectItem value="open_quotations">Sadece Açık Teklifler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Devreden</p>
                  <p className="font-medium">{preview.source_user_name}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Devralan</p>
                  <p className="font-medium">{preview.target_user_name}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <Users className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{preview.customers_count}</p>
                <p className="text-sm text-muted-foreground">Müşteri</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <FileText className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{preview.quotations_count}</p>
                <p className="text-sm text-muted-foreground">Teklif</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Devir Sebebi <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Devir sebebini giriniz..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="deactivate"
                checked={deactivateSource}
                onCheckedChange={(checked) => setDeactivateSource(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="deactivate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Eski temsilciyi pasife al
                </Label>
                <p className="text-sm text-muted-foreground">
                  Devreden temsilci sistemde pasif duruma getirilecek
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="py-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-800">Devir İşlemi Tamamlandı</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-700">{result.transferred_customers}</p>
                  <p className="text-sm text-green-600">Müşteri devredildi</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{result.transferred_quotations}</p>
                  <p className="text-sm text-green-600">Teklif devredildi</p>
                </div>
              </div>
              {result.deactivated_user && (
                <p className="mt-4 text-sm text-green-600">Eski temsilci pasife alındı</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button onClick={handlePreview} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  'Devam Et'
                )}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')} disabled={isLoading}>
                Geri
              </Button>
              <Button onClick={handleExecute} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  'Devir İşlemini Onayla'
                )}
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button onClick={onClose}>Kapat</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
