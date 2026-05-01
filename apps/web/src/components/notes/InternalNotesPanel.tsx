import { useEffect, useRef, useState } from 'react';
import { Card, Button, Icon, Skeleton } from '@/components/ui';
import api from '@/config/api';

interface Note {
  id: number;
  ownerType: string;
  ownerId: number;
  authorId: number;
  content: string;
  mentionedUserIds: number[];
  createdAt: string;
  author: { id: number; fullName: string } | null;
}

interface InternalNotesPanelProps {
  ownerType: 'customer' | 'quotation' | 'shipment';
  ownerId: number;
  /** URL hash veya parent isteğiyle textarea'yı odaklamak icin tetikleyici */
  focusSignal?: number;
}

export function InternalNotesPanel({ ownerType, ownerId, focusSignal }: InternalNotesPanelProps) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (focusSignal === undefined) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [focusSignal]);

  async function fetchNotes() {
    setLoading(true);
    try {
      const { data } = await api.get<Note[]>('/notes', {
        params: { ownerType, ownerId },
      });
      setNotes(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerType, ownerId]);

  async function submit() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await api.post('/notes', { ownerType, ownerId, content });
      setContent('');
      await fetchNotes();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Not silinsin mi?')) return;
    await api.delete(`/notes/${id}`);
    fetchNotes();
  }

  return (
    <Card title="İç Notlar">
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Not yazın... @isim ile ekip üyesini etiketleyin"
          className="w-full min-h-[80px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <div className="mt-2 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={submit}
            loading={saving}
            disabled={!content.trim()}
          >
            Not Ekle
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton variant="text" />
      ) : !notes || notes.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">Not yok.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-slate-100 dark:border-slate-800 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {n.author?.fullName || 'Bilinmeyen'}
                  </span>
                  <span className="text-slate-500">
                    {new Date(n.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-slate-400 hover:text-red-500"
                  title="Sil"
                >
                  <Icon name="delete" size="sm" />
                </button>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {n.content}
              </p>
              {n.mentionedUserIds.length > 0 && (
                <div className="text-xs text-primary mt-2">
                  {n.mentionedUserIds.length} kullanıcı etiketlendi
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
