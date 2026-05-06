import { useNavigate } from 'react-router-dom';
import { Modal, Button, Icon, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { formatTrPhones } from '@nakliye-crm/shared';
import type { ConflictMatch, ConflictMatchType } from '@/services/customer.service';

interface ConflictWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForceCreate: () => void;
  matches: ConflictMatch[];
  loading?: boolean;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const MATCH_TYPE_LABEL: Record<ConflictMatchType, { label: string; icon: string }> = {
  company_name: { label: 'Firma adı benzer', icon: 'business' },
  phone: { label: 'Telefon eşleşti', icon: 'phone' },
  email: { label: 'E-posta eşleşti', icon: 'mail' },
  email_domain: { label: 'Aynı firma e-postası (kurumsal alan adı)', icon: 'domain' },
  tax_number: { label: 'Aynı vergi numarası', icon: 'badge' },
};

export function ConflictWarningModal({
  isOpen,
  onClose,
  onForceCreate,
  matches,
  loading = false,
}: ConflictWarningModalProps) {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const definite = matches.filter((m) => m.severity === 'definite');
  const likely = matches.filter((m) => m.severity === 'likely');
  const hasDefinite = definite.length > 0;

  // Definite (kesin eslesme) varsa USER bypass edemez; yalniz ADMIN
  const canForce = !hasDefinite || isAdmin;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div
          className={`flex items-center justify-center size-16 rounded-full mx-auto mb-4 ${
            hasDefinite
              ? 'bg-red-100 dark:bg-red-500/15'
              : 'bg-amber-100 dark:bg-amber-500/15'
          }`}
        >
          <Icon
            name={hasDefinite ? 'block' : 'warning'}
            className={hasDefinite ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}
            size="lg"
          />
        </div>
        <h2
          className={`text-xl font-bold mb-2 ${
            hasDefinite ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'
          }`}
        >
          {hasDefinite ? 'Kesin Eşleşme — Bu Müşteri Zaten Kayıtlı' : 'Benzer Müşteri Kaydı Bulundu'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {hasDefinite
            ? 'Aşağıdaki kayıt(lar) telefon, e-posta veya firma adıyla doğrudan eşleşiyor.'
            : 'Aşağıdaki kayıt(lar) muhtemel mükerrer olabilir. Devam etmek istiyorsanız onaylayın.'}
        </p>
      </div>

      {/* Matching customers list */}
      <div className="space-y-3 mb-6 max-h-[420px] overflow-y-auto pr-1">
        {[...definite, ...likely].map((match) => {
          const typeInfo = MATCH_TYPE_LABEL[match.matchType] ?? MATCH_TYPE_LABEL.company_name;
          const isDefinite = match.severity === 'definite';
          return (
            <div
              key={`${match.customerId}-${match.matchType}`}
              className={`border rounded-xl p-4 transition-colors ${
                isDefinite
                  ? 'border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5'
                  : 'border-amber-200 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {match.companyName}
                    </span>
                    <Badge variant={isDefinite ? 'danger' : 'warning'} size="sm">
                      %{Math.round(match.similarity)} {isDefinite ? 'Kesin' : 'Benzer'}
                    </Badge>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      title={match.matchedOn ?? ''}
                    >
                      <Icon name={typeInfo.icon} size="sm" className="!text-[13px]" />
                      {typeInfo.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                    {match.assignedUserName && (
                      <span className="flex items-center gap-1">
                        <Icon name="person" size="sm" className="text-slate-400 dark:text-slate-500" />
                        {match.assignedUserName}
                      </span>
                    )}
                    {match.lastContactDate && (
                      <span className="flex items-center gap-1">
                        <Icon name="event" size="sm" className="text-slate-400 dark:text-slate-500" />
                        {formatDate(match.lastContactDate)}
                      </span>
                    )}
                  </div>
                  {match.phone && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                      <Icon name="phone" size="sm" className="text-slate-400 dark:text-slate-500 mr-1 inline" />
                      {formatTrPhones(match.phone) || match.phone}
                    </p>
                  )}
                  {match.email && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <Icon name="mail" size="sm" className="text-slate-400 dark:text-slate-500 mr-1 inline" />
                      {match.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/musteriler/${match.customerId}`)}
                  className="text-sm text-primary font-medium hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  Kaydı Aç
                  <Icon name="open_in_new" size="sm" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Vazgeç
        </Button>
        <div className="flex items-center gap-3">
          {hasDefinite && !isAdmin ? (
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">
              Yönetici onayı gerekir
            </span>
          ) : (
            hasDefinite && (
              <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">
                Admin yetkisiyle devam ediliyor
              </span>
            )
          )}
          <Button
            variant={hasDefinite ? 'danger' : 'primary'}
            onClick={onForceCreate}
            loading={loading}
            disabled={!canForce}
            title={
              !canForce
                ? 'Kesin eşleşmede USER yetkisi yetmez; yöneticinizden bu kaydı onaylamasını isteyin.'
                : undefined
            }
          >
            Yine de Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
