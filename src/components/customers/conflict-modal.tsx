import * as React from 'react';
import { AlertTriangle, User, Phone, Mail, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CustomerConflict } from '@/types';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conflicts: CustomerConflict[];
  isAdmin: boolean;
}

export function ConflictModal({
  isOpen,
  onClose,
  onConfirm,
  conflicts,
  isAdmin,
}: ConflictModalProps) {
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Müşteri Çakışması Tespit Edildi</DialogTitle>
          </div>
          <DialogDescription>
            Girmekte olduğunuz müşteri bilgileri ile aşağıdaki kayıtlar
            eşleşiyor. Lütfen mevcut kayıtları kontrol edin.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-3 overflow-auto py-4">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="rounded-lg border bg-muted/50 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{conflict.company_name}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    conflict.matched_field === 'email'
                      ? 'bg-red-100 text-red-700'
                      : conflict.matched_field === 'phone'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {getMatchLabel(conflict.matched_field)}
                </span>
              </div>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                {conflict.contact_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>{conflict.contact_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{conflict.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{conflict.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          {isAdmin ? (
            <Button
              onClick={onConfirm}
              variant="destructive"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Yine de Kaydet
            </Button>
          ) : (
            <Button disabled variant="secondary">
              Mevcut Kaydı Kullan
            </Button>
          )}
        </DialogFooter>

        {!isAdmin && (
          <p className="text-center text-xs text-muted-foreground">
            Çakışma tespit edildiğinde yeni kayıt oluşturamazsınız. Lütfen
            mevcut müşteri kaydını kullanın veya yöneticinize başvurun.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
