import { useNavigate } from 'react-router-dom';
import { Modal, Button, Icon, Badge } from '@/components/ui';
import type { ConflictMatch } from '@/services/customer.service';

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

export function ConflictWarningModal({
  isOpen,
  onClose,
  onForceCreate,
  matches,
  loading = false,
}: ConflictWarningModalProps) {
  const navigate = useNavigate();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl"
    >
      {/* Header with warning icon */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center size-16 rounded-full bg-amber-100 mx-auto mb-4">
          <Icon name="warning" className="text-amber-600" size="lg" />
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">
          Bu Musteri Zaten Kayitli Olabilir
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sistemde benzer kayitlar bulundu:
        </p>
      </div>

      {/* Matching customers list */}
      <div className="space-y-3 mb-6">
        {matches.map((match) => (
          <div
            key={match.customerId}
            className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {match.companyName}
                  </span>
                  <Badge variant="warning" size="sm">
                    %{match.similarity} Benzerlik
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
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
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <Icon name="phone" size="sm" className="text-slate-400 dark:text-slate-500 mr-1 inline" />
                    {match.phone}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate(`/musteriler/${match.customerId}`)}
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1 flex-shrink-0"
              >
                Kaydi Ac
                <Icon name="open_in_new" size="sm" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Iptal
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">
            ADMIN ONAYI GEREKLI
          </span>
          <Button variant="danger" onClick={onForceCreate} loading={loading}>
            Yine de Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
