import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Icon, Skeleton } from '@/components/ui';
import api from '@/config/api';
import { MentionTextarea } from './MentionTextarea';
import { resolveMentionsFromText, type MentionUser } from './mention-utils';
import { userService } from '@/services/user.service';

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
  const [users, setUsers] = useState<MentionUser[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (focusSignal === undefined) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [focusSignal]);

  // Aktif ekip uyelerini cek (mention autocomplete icin). Tek seferlik.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await userService.getAll(1, 200);
        if (cancelled) return;
        const list: MentionUser[] = (res.data ?? [])
          .filter((u) => (u as { isActive?: boolean }).isActive !== false)
          .map((u) => ({ id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl ?? null }));
        setUsers(list);
      } catch {
        // Mention listesi olmasa da panel calismali
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const mentionedUserIds = resolveMentionsFromText(content, users);
      await api.post('/notes', { ownerType, ownerId, content, mentionedUserIds });
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

  const liveMentionIds = useMemo(
    () => resolveMentionsFromText(content, users),
    [content, users],
  );

  return (
    <Card title="İç Notlar">
      <div className="mb-4">
        <MentionTextarea
          ref={textareaRef}
          value={content}
          onChange={setContent}
          users={users}
          placeholder="Not yazın... @ ile ekip üyesini etiketleyin"
          rows={3}
          onSubmitShortcut={submit}
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {liveMentionIds.length > 0 ? (
              <span>
                <Icon name="alternate_email" size="sm" className="align-text-bottom mr-0.5" />
                {liveMentionIds.length} kişi etiketlendi · bildirim gidecek
              </span>
            ) : (
              <span className="opacity-70">Cmd/Ctrl+Enter ile hızlı gönder</span>
            )}
          </div>
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
                <NoteContent content={n.content} users={users} />
              </p>
              {n.mentionedUserIds.length > 0 && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                  <Icon name="notifications" size="sm" />
                  {n.mentionedUserIds.length} kişi bildirildi
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Notu render ederken "@Ad Soyad" mention'larini mavi pill olarak gosterir.
 * Sadece mevcut users listesindeki adlarla eslesen mention'lar highlight edilir.
 */
function NoteContent({ content, users }: { content: string; users: MentionUser[] }) {
  if (users.length === 0) return <>{content}</>;
  // En uzun isim once eslesmesin diye sortla — "Ahmet Yilmaz" "Ahmet"e tercih edilsin
  const sorted = [...users].sort((a, b) => b.fullName.length - a.fullName.length);
  const parts: Array<string | { name: string; id: number }> = [content];

  for (const u of sorted) {
    const token = '@' + u.fullName;
    const next: typeof parts = [];
    for (const p of parts) {
      if (typeof p !== 'string') {
        next.push(p);
        continue;
      }
      let rest = p;
      let idx = rest.toLocaleLowerCase('tr-TR').indexOf(token.toLocaleLowerCase('tr-TR'));
      while (idx !== -1) {
        const left = idx === 0 ? ' ' : rest[idx - 1];
        const rightChar = rest[idx + token.length] ?? ' ';
        const isBoundary = /\s/.test(left) && (/\s|[.,;:!?]/.test(rightChar) || rightChar === '');
        if (isBoundary) {
          if (idx > 0) next.push(rest.slice(0, idx));
          next.push({ name: u.fullName, id: u.id });
          rest = rest.slice(idx + token.length);
          idx = rest.toLocaleLowerCase('tr-TR').indexOf(token.toLocaleLowerCase('tr-TR'));
        } else {
          // Sinir kontrolu basarisizsa bu eslesmeyi atla, ileri tara
          const after = rest.slice(idx + 1);
          const more = after.toLocaleLowerCase('tr-TR').indexOf(token.toLocaleLowerCase('tr-TR'));
          if (more === -1) {
            break;
          }
          // Kalan'i parcala: korunan kisim + araniyor olan kisim
          next.push(rest.slice(0, idx + 1 + more));
          rest = rest.slice(idx + 1 + more);
          idx = 0;
        }
      }
      if (rest) next.push(rest);
    }
    parts.length = 0;
    parts.push(...next);
  }

  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <span
            key={i}
            className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[12px] font-medium text-primary"
          >
            @{p.name}
          </span>
        ),
      )}
    </>
  );
}
