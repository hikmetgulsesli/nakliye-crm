import { useEffect, useRef, useState } from 'react';
import { Card, Button, Icon, Skeleton, Select } from '@/components/ui';
import {
  documentService,
  type DocumentRec,
  type OwnerType,
  type DocumentCategory,
  CATEGORY_LABELS,
} from '@/services/document.service';

interface DocumentsPanelProps {
  ownerType: OwnerType;
  ownerId: number;
  title?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map((k) => ({
  value: k,
  label: CATEGORY_LABELS[k],
}));

export function DocumentsPanel({ ownerType, ownerId, title = 'Dokümanlar' }: DocumentsPanelProps) {
  const [docs, setDocs] = useState<DocumentRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function fetchDocs() {
    setLoading(true);
    try {
      const data = await documentService.list(ownerType, ownerId);
      setDocs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerType, ownerId]);

  async function upload(files: FileList) {
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await documentService.upload(ownerType, ownerId, file, category);
      }
      await fetchDocs();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (err as Error).message ||
        'Yükleme başarısız';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: DocumentRec) {
    const { url } = await documentService.downloadUrl(doc.id);
    window.open(url, '_blank', 'noopener');
  }

  async function handleDelete(doc: DocumentRec) {
    if (!confirm(`"${doc.filename}" silinsin mi?`)) return;
    await documentService.remove(doc.id);
    fetchDocs();
  }

  return (
    <Card title={title}>
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={[
          'rounded-xl border-2 border-dashed transition-colors p-6 mb-4 text-center cursor-pointer',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
        ].join(' ')}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = '';
          }}
        />
        <Icon name="cloud_upload" className="text-slate-400" />
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          Dosyayı buraya sürükleyin veya <span className="text-primary font-medium">seçmek için tıklayın</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">PDF, resim, Office dosyaları — max 25 MB</p>
      </div>

      {/* Category */}
      <div className="flex items-end gap-3 mb-4">
        <div className="w-56">
          <Select
            label="Kategori"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            options={CATEGORY_OPTIONS}
          />
        </div>
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 pb-3">
            <span className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
            Yükleniyor...
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 mb-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          Henüz doküman yok.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-3">
              <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <Icon
                  name={d.contentType?.startsWith('image/') ? 'image' : 'description'}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                    {d.filename}
                  </span>
                  {d.version > 1 && (
                    <span className="text-xs text-slate-500">v{d.version}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {CATEGORY_LABELS[d.category]}
                  </span>
                  <span>{formatSize(d.sizeBytes)}</span>
                  <span>{new Date(d.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon="download"
                onClick={() => handleDownload(d)}
              >
                İndir
              </Button>
              <button
                onClick={() => handleDelete(d)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Sil"
              >
                <Icon name="delete" size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
