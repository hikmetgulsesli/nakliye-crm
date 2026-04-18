import { useState } from 'react';
import { Modal, Button, Select, Icon } from '@/components/ui';
import { aiService } from '@/services/ai.service';
import { emailsService } from '@/services/emails.service';

interface AIEmailDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId: number;
  customerEmail: string;
  customerName: string;
}

type Language = 'tr' | 'en';
type Tone = 'formal' | 'friendly' | 'concise';

export function AIEmailDraftModal({
  isOpen,
  onClose,
  quotationId,
  customerEmail,
  customerName,
}: AIEmailDraftModalProps) {
  const [language, setLanguage] = useState<Language>('tr');
  const [tone, setTone] = useState<Tone>('formal');
  const [extra, setExtra] = useState('');
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState(customerEmail);
  const [cc, setCc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const res = await aiService.draftQuoteEmail(quotationId, {
        language,
        tone,
        extraInstructions: extra.trim() || undefined,
      });
      setDraft(res.draft);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'AI taslağı oluşturulamadı. API key yapılandırılmış mı kontrol edin.',
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    setError(null);
    setSending(true);
    try {
      const ccList = cc
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await emailsService.sendQuotationEmail(quotationId, {
        messageBody: draft,
        recipientEmail: recipient,
        cc: ccList.length ? ccList : undefined,
      });
      setSentMsg(`E-posta ${recipient} adresine gönderildi`);
      setTimeout(() => {
        setSentMsg(null);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'E-posta gönderilemedi. E-posta servisinin yapılandırıldığından emin olun.',
      );
    } finally {
      setSending(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
    setSentMsg('Panoya kopyalandı');
    setTimeout(() => setSentMsg(null), 2000);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`AI E-posta Taslağı — ${customerName}`}
      className="!max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Kapat
          </Button>
          <Button
            variant="secondary"
            icon="content_copy"
            onClick={handleCopy}
            disabled={!draft}
          >
            Kopyala
          </Button>
          <Button
            variant="primary"
            icon="send"
            onClick={handleSend}
            loading={sending}
            disabled={!draft || !recipient}
          >
            E-posta Gönder
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Config row */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Dil"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            options={[
              { value: 'tr', label: 'Türkçe' },
              { value: 'en', label: 'English' },
            ]}
          />
          <Select
            label="Ton"
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            options={[
              { value: 'formal', label: 'Resmî' },
              { value: 'friendly', label: 'Samimi' },
              { value: 'concise', label: 'Kısa' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Ekstra Talimat (opsiyonel)
          </label>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Örn: Erken ödeme indirimi vurgula, gümrük süresini belirt..."
            className="w-full min-h-[60px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <Button
          variant="primary"
          icon="auto_awesome"
          onClick={handleGenerate}
          loading={generating}
          className="w-full"
        >
          {draft ? 'Yeniden Oluştur' : 'AI ile Taslak Oluştur'}
        </Button>

        {/* Draft editor */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Taslak {draft && '(düzenleyebilirsiniz)'}
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={generating ? 'Oluşturuluyor...' : 'AI ile oluştur butonuna tıklayın'}
            className="w-full min-h-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm p-3 font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Recipient + cc */}
        {draft && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Alıcı
              </label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                CC (virgülle ayırın)
              </label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="ornek@domain.com, ornek2@domain.com"
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
            <Icon name="error" className="text-red-500 flex-shrink-0" size="sm" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}
        {sentMsg && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 flex items-start gap-2">
            <Icon name="check_circle" className="text-emerald-500 flex-shrink-0" size="sm" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300">{sentMsg}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
