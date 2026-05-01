import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import api from '@/config/api';
import { Icon } from '@/components/ui';

interface SearchResults {
  customers: Array<{ id: number; companyName: string; contactName?: string | null }>;
  quotations: Array<{
    id: number;
    quoteNo: string;
    status: string;
    customer?: { companyName: string };
  }>;
  shipments: Array<{
    id: number;
    shipmentNo: string;
    status: string;
    customer?: { companyName: string };
  }>;
  activities: Array<{
    id: number;
    notes: string | null;
    customer?: { id: number; companyName: string };
  }>;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Ctrl+K / Cmd+K ile ac
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get<SearchResults>('/search', { params: { q: query } });
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery('');
      navigate(path);
    },
    [navigate],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <Command
        label="Global search"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Icon name="search" className="text-slate-400" size="sm" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Müşteri, teklif, sevkiyat ara... (Esc kapat)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
          {loading && (
            <span className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
          )}
          <kbd className="text-xs text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          {!results && !loading && (
            <div className="py-8 text-center text-sm text-slate-500">
              En az 2 karakter yazın
            </div>
          )}
          {results && (
            <>
              {results.customers.length > 0 && (
                <Command.Group heading="Müşteriler">
                  {results.customers.map((c) => (
                    <Command.Item
                      key={`c-${c.id}`}
                      value={`musteri ${c.companyName} ${c.contactName ?? ''}`}
                      onSelect={() => go(`/musteriler/${c.id}`)}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-slate-800 text-sm"
                    >
                      <Icon name="business" size="sm" className="text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.companyName}</div>
                        {c.contactName && (
                          <div className="text-xs text-slate-500 truncate">{c.contactName}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="Görüşme notu ekle"
                          aria-label="Görüşme notu ekle"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            go(`/musteriler/${c.id}#internal-notes`);
                          }}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-primary/10 hover:text-primary"
                        >
                          <Icon name="edit_note" size="sm" />
                        </button>
                        <button
                          type="button"
                          title="Teklif oluştur"
                          aria-label="Teklif oluştur"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            go(`/teklifler/yeni?customerId=${c.id}`);
                          }}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                        >
                          <Icon name="request_quote" size="sm" />
                        </button>
                        <button
                          type="button"
                          title="Firma bilgilerini düzenle"
                          aria-label="Firma bilgilerini düzenle"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            go(`/musteriler/${c.id}/duzenle`);
                          }}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
                        >
                          <Icon name="edit" size="sm" />
                        </button>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {results.quotations.length > 0 && (
                <Command.Group heading="Teklifler">
                  {results.quotations.map((q) => (
                    <Command.Item
                      key={`q-${q.id}`}
                      onSelect={() => go(`/teklifler/${q.id}`)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-slate-800 text-sm"
                    >
                      <Icon name="request_quote" size="sm" className="text-slate-400" />
                      <div className="flex-1">
                        <div className="font-medium">{q.quoteNo}</div>
                        <div className="text-xs text-slate-500">
                          {q.customer?.companyName} · {q.status}
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {results.shipments.length > 0 && (
                <Command.Group heading="Sevkiyatlar">
                  {results.shipments.map((s) => (
                    <Command.Item
                      key={`s-${s.id}`}
                      onSelect={() => go(`/sevkiyatlar/${s.id}`)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-slate-800 text-sm"
                    >
                      <Icon name="local_shipping" size="sm" className="text-slate-400" />
                      <div className="flex-1">
                        <div className="font-medium">{s.shipmentNo}</div>
                        <div className="text-xs text-slate-500">
                          {s.customer?.companyName} · {s.status}
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {results.activities.length > 0 && (
                <Command.Group heading="Aktiviteler">
                  {results.activities.map((a) => (
                    <Command.Item
                      key={`a-${a.id}`}
                      onSelect={() => go(`/musteriler/${a.customer?.id}`)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-slate-800 text-sm"
                    >
                      <Icon name="event_note" size="sm" className="text-slate-400" />
                      <div className="flex-1">
                        <div className="font-medium truncate">
                          {a.notes?.slice(0, 60) || 'Aktivite'}
                        </div>
                        <div className="text-xs text-slate-500">{a.customer?.companyName}</div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {results.customers.length === 0 &&
                results.quotations.length === 0 &&
                results.shipments.length === 0 &&
                results.activities.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-500">Sonuç bulunamadı</div>
                )}
            </>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
