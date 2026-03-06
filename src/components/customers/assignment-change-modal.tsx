'use client';

import * as React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
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
import type { User } from '@/types';

interface AssignmentChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    toUserId: string;
    reason: string;
    cascadeToOpenQuotes: boolean;
  }) => Promise<void>;
  currentAssignedUserId: string;
  users: User[];
  customerName: string;
}

export function AssignmentChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentAssignedUserId,
  users,
  customerName,
}: AssignmentChangeModalProps) {
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [cascadeToOpenQuotes, setCascadeToOpenQuotes] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      setReason('');
      setCascadeToOpenQuotes(false);
      setError(null);
    }
  }, [isOpen]);

  const activeUsers = users.filter((u) => u.is_active && u.id !== currentAssignedUserId);
  const currentUser = users.find((u) => u.id === currentAssignedUserId);

  const handleConfirm = async () => {
    if (!selectedUserId) {
      setError('Yeni temsilci seçiniz');
      return;
    }
    if (!reason.trim()) {
      setError('Değişiklik sebebini giriniz');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm({
        toUserId: selectedUserId,
        reason: reason.trim(),
        cascadeToOpenQuotes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Temsilci Değişikliği</DialogTitle>
          <DialogDescription>
            {customerName} için temsilci atamasını değiştirin
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

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Mevcut Temsilci</p>
              <p className="font-medium">{currentUser?.full_name || 'Bilinmiyor'}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Yeni Temsilci</p>
              <p className="font-medium">
                {selectedUserId
                  ? users.find((u) => u.id === selectedUserId)?.full_name
                  : 'Seçiniz'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-rep">
              Yeni Temsilci <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="new-rep">
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
            <Label htmlFor="reason">
              Değişiklik Sebebi <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Değişiklik sebebini giriniz..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="cascade"
              checked={cascadeToOpenQuotes}
              onCheckedChange={(checked: boolean | 'indeterminate') =>
                setCascadeToOpenQuotes(checked === true)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="cascade"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Açık teklifleri de devret
              </Label>
              <p className="text-sm text-muted-foreground">
                Müşteriye ait bekleyen teklifler de yeni temsilciye atanacak
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !selectedUserId}>
            {isLoading ? 'İşleniyor...' : 'Değişikliği Onayla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
