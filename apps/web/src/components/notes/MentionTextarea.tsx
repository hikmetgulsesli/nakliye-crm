import { useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { fold, scoreMatch, type MentionUser } from './mention-utils';

interface MentionTextareaProps {
  value: string;
  onChange: (next: string) => void;
  users: MentionUser[];
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  onSubmitShortcut?: () => void;
}

/**
 * Textarea + @ tetikli kullanici autocomplete.
 * - "@" yazilinca caret pozisyonunda popover acilir.
 * - Arrow Up/Down ile gez, Enter/Tab ile sec, Esc ile kapat.
 * - Sec → metin "@Ad Soyad " olarak yerlestirilir.
 */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  function MentionTextarea(
    { value, onChange, users, placeholder, className, rows = 3, disabled, onSubmitShortcut },
    forwardedRef,
  ) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    // @ baslangic offset'i (textarea value icindeki indeks)
    const [anchor, setAnchor] = useState<number | null>(null);

    function setRef(el: HTMLTextAreaElement | null) {
      innerRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    }

    const filtered = useMemo(() => {
      if (!open) return [];
      if (!query) return users.slice(0, 8);
      const q = fold(query);
      return users
        .map((u) => ({ u, score: scoreMatch(fold(u.fullName), q) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((x) => x.u);
    }, [open, query, users]);

    useEffect(() => {
      if (active >= filtered.length) setActive(0);
    }, [filtered, active]);

    function detectMention(textValue: string, caret: number) {
      // Caret'ten geriye dogru @ ara; bosluk veya newline gelirse iptal
      let i = caret - 1;
      while (i >= 0) {
        const ch = textValue[i];
        if (ch === '@') {
          // @'nin solunda metin yoksa veya bosluk varsa gecerli mention baslangici
          if (i === 0 || /\s/.test(textValue[i - 1])) {
            const q = textValue.slice(i + 1, caret);
            // Mention query icinde yeni satir/3'ten fazla kelime varsa iptal
            if (q.length > 30 || /\n/.test(q)) {
              setOpen(false);
              setAnchor(null);
              return;
            }
            setAnchor(i);
            setQuery(q);
            setOpen(true);
            return;
          }
          break;
        }
        if (/\s/.test(ch) && caret - i > 30) break;
        i--;
      }
      setOpen(false);
      setAnchor(null);
    }

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      const next = e.target.value;
      onChange(next);
      const caret = e.target.selectionStart ?? next.length;
      detectMention(next, caret);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (open && filtered.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive((a) => (a + 1) % filtered.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive((a) => (a - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          select(filtered[active]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
          setAnchor(null);
          return;
        }
      }
      // Cmd/Ctrl+Enter ile submit shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onSubmitShortcut) {
        e.preventDefault();
        onSubmitShortcut();
      }
    }

    function select(u: MentionUser) {
      const el = innerRef.current;
      if (!el || anchor === null) return;
      const caret = el.selectionStart ?? value.length;
      const before = value.slice(0, anchor);
      const after = value.slice(caret);
      const insertion = `@${u.fullName} `;
      const next = before + insertion + after;
      onChange(next);
      setOpen(false);
      setAnchor(null);
      setQuery('');
      const newCaret = (before + insertion).length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(newCaret, newCaret);
      });
    }

    function handleClick() {
      const el = innerRef.current;
      if (!el) return;
      detectMention(value, el.selectionStart ?? value.length);
    }

    return (
      <div className="relative">
        <textarea
          ref={setRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onBlur={() => {
            // Tikla-secimine sans tani — popover icindeki click oncesi kapanmasin
            window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y',
            className,
          )}
        />
        {open && filtered.length > 0 && (
          <ul
            className="absolute z-30 mt-1 w-72 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1"
            // anchor pozisyonuna gore koymak ideal ama caret coordinates karmaşık.
            // Pratik: textarea'nin altina sabit konum. Buyuk metinlerde bile is gorur.
            style={{ top: '100%', left: 0 }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <li className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Ekip uyesi etiketle
            </li>
            {filtered.map((u, idx) => (
              <li
                key={u.id}
                onClick={() => select(u)}
                onMouseEnter={() => setActive(idx)}
                className={cn(
                  'px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2',
                  idx === active
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
                )}
              >
                <span className="grid size-6 flex-shrink-0 place-items-center rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                  {initials(u.fullName)}
                </span>
                <span className="truncate">{u.fullName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase('tr-TR');
}

