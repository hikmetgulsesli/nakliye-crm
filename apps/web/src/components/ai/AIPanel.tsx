import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { aiService } from '@/services/ai.service';
import { cn } from '@/utils/cn';
import api from '@/config/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  { label: 'Bu sayfayı özetle', prompt: 'Şu an açık olan sayfanın içeriğini kısaca özetle.' },
  { label: 'Sıradaki adım ne olmalı?', prompt: 'Bu kayıt için bir sonraki adım ne olmalı? 2-3 öneri ver.' },
  { label: 'Bana bir e-posta taslağı yaz', prompt: 'Bu müşteri/teklif için kısa, profesyonel bir e-posta taslağı yaz (Türkçe).' },
];

/**
 * Sağdan slide-in AI panel — Cmd/Ctrl+J ile açılır.
 * Mevcut sayfanın URL'inden kısa bir bağlam çıkarır, AI'a sistem mesajı
 * olarak verir; kullanıcı ile çok turlu sohbet eder.
 */
export function AIPanel({ open, onClose }: AIPanelProps) {
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [providerInfo, setProviderInfo] = useState<{ provider: string | null; defaultModel: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Açıldığında provider bilgisini çek (status + temizle)
  useEffect(() => {
    if (!open) return;
    aiService
      .status()
      .then((s) => setProviderInfo({ provider: s.provider, defaultModel: s.defaultModel }))
      .catch(() => setProviderInfo({ provider: null, defaultModel: null }));
    setError(null);
  }, [open]);

  // Yeni mesaj gelince scroll en alta
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  function describeContext(): string {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Genel dashboard ekranındayım.';
    if (path === '/musteriler') return 'Müşteri listesi sayfasındayım.';
    if (/^\/musteriler\/(\d+)$/.test(path)) {
      const m = path.match(/^\/musteriler\/(\d+)$/);
      return `Müşteri #${m![1]} detay sayfasındayım.`;
    }
    if (path === '/teklifler') return 'Teklif listesi sayfasındayım.';
    if (/^\/teklifler\/(\d+)$/.test(path)) {
      const m = path.match(/^\/teklifler\/(\d+)$/);
      return `Teklif #${m![1]} detay sayfasındayım.`;
    }
    if (path === '/sevkiyatlar') return 'Sevkiyat listesi sayfasındayım.';
    if (/^\/sevkiyatlar\/(\d+)$/.test(path)) {
      const m = path.match(/^\/sevkiyatlar\/(\d+)$/);
      return `Sevkiyat #${m![1]} detay sayfasındayım.`;
    }
    if (path === '/raporlar') return 'Raporlar sayfasındayım.';
    return `Ekrandayım: ${path}`;
  }

  async function send(promptText?: string) {
    const text = (promptText ?? input).trim();
    if (!text || busy) return;
    setInput('');
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg, { role: 'assistant', content: '', pending: true }]);
    setBusy(true);

    try {
      const systemPrompt = `Sen NakliyeCRM içinde gömülü, kullanıcının yanındaki bir asistansın.
Türkçe, kısa ve doğrudan cevap ver. Belirsiz övgülerden kaçın.
Bağlam: ${describeContext()}`;

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await api.post('/ai/chat', {
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        maxTokens: 600,
        temperature: 0.5,
      });

      const reply = (data?.text as string) ?? 'Cevap alınamadı.';
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: reply };
        return copy;
      });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e.response?.data?.message ?? e.message ?? 'AI cevabı alınamadı.';
      setError(msg);
      setMessages((m) => {
        const copy = [...m];
        // Pending olanı sil
        copy.pop();
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setMessages([]);
    setError(null);
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <TransitionChild
            as={Fragment}
            enter="transform transition ease-out duration-250"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <DialogPanel className="flex h-full w-screen max-w-md flex-col bg-token-bg-elev shadow-token-lg">
              {/* Header */}
              <div
                className="flex items-center gap-2.5 border-b border-token-border px-4"
                style={{ height: 'var(--topbar-h)' }}
              >
                <div
                  className="grid size-7 place-items-center rounded-md text-white shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--magenta))',
                  }}
                >
                  <Icon name="auto_awesome" size="sm" className="!text-[14px]" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-token-text">CRM Asistanı</div>
                  <div className="text-[11px] text-token-muted">
                    {providerInfo?.provider
                      ? `${providerInfo.provider} · ${providerInfo.defaultModel}`
                      : 'Sağlayıcı yapılandırılmamış'}
                  </div>
                </div>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-md p-1.5 text-token-muted hover:bg-token-bg-hover hover:text-token-text"
                    title="Sohbeti temizle"
                  >
                    <Icon name="delete_sweep" size="sm" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-token-muted hover:bg-token-bg-hover hover:text-token-text"
                  title="Kapat (Esc / ⌘J)"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>

              {/* Body */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-token-border bg-token-bg-subtle p-3 text-[13px] text-token-text">
                      <strong>Bağlam:</strong> {describeContext()}
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-token-muted">
                      Önerilen sorular
                    </div>
                    <div className="space-y-1.5">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => send(s.prompt)}
                          className="flex w-full items-center gap-2 rounded-md border border-token-border bg-token-bg-elev px-3 py-2 text-left text-[13px] text-token-text transition-colors hover:bg-token-bg-hover"
                        >
                          <Icon name="bolt" size="sm" className="!text-[14px] text-magenta" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      'mb-3 flex gap-2.5',
                      m.role === 'user' ? 'flex-row-reverse' : '',
                    )}
                  >
                    <div
                      className="grid size-6 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                      style={{
                        background:
                          m.role === 'user'
                            ? 'var(--accent)'
                            : 'linear-gradient(135deg, var(--accent), var(--magenta))',
                      }}
                    >
                      {m.role === 'user' ? 'S' : 'AI'}
                    </div>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed',
                        m.role === 'user'
                          ? 'bg-brand text-brand-fg'
                          : 'bg-token-bg-subtle text-token-text',
                      )}
                    >
                      {m.pending ? (
                        <span className="inline-flex items-center gap-1.5 text-token-muted">
                          <Icon
                            name="progress_activity"
                            size="sm"
                            className="!text-[13px] animate-spin"
                          />
                          Düşünüyor…
                        </span>
                      ) : (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: m.content
                              .replace(/&/g, '&amp;')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;')
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br/>'),
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {error && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                    {error}
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                className="border-t border-token-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <div className="flex items-end gap-2 rounded-xl border border-token-border bg-token-bg-subtle px-3 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-soft">
                  <textarea
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Asistana sor… (Shift+Enter satır)"
                    className="flex-1 resize-none bg-transparent text-[13px] text-token-text placeholder-token-subtle outline-none"
                    disabled={busy}
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="grid size-8 place-items-center rounded-md bg-brand text-brand-fg transition-colors hover:bg-brand-hover disabled:opacity-50"
                    title="Gönder (Enter)"
                  >
                    <Icon name="send" size="sm" />
                  </button>
                </div>
                <div className="mt-1.5 px-1 text-[10px] text-token-subtle">
                  Enter gönder · Shift+Enter satır · ⌘J kapat
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
