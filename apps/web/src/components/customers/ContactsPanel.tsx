import { useEffect, useState } from 'react';
import { Card, Button, Icon, Skeleton, Modal } from '@/components/ui';
import api from '@/config/api';
import { useFeature } from '@/stores/featuresStore';

interface Contact {
  id: number;
  customerId: number;
  fullName: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  birthdate?: string | null;
  notes?: string | null;
  isPrimary: boolean;
}

export function ContactsPanel({ customerId }: { customerId: number }) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contact | 'new' | null>(null);
  const clickToCall = useFeature('click_to_call');

  async function fetchContacts() {
    setLoading(true);
    try {
      const { data } = await api.get<Contact[]>('/customer-contacts', {
        params: { customerId },
      });
      setContacts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContacts();
  }, [customerId]);

  async function handleDelete(id: number) {
    if (!confirm('Yetkili silinsin mi?')) return;
    await api.delete(`/customer-contacts/${id}`);
    fetchContacts();
  }

  return (
    <Card
      title="Yetkililer"
      action={
        <Button size="sm" icon="person_add" onClick={() => setEditing('new')}>
          Yetkili Ekle
        </Button>
      }
    >
      {loading ? (
        <Skeleton variant="text" />
      ) : !contacts || contacts.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
          Henüz yetkili eklenmemiş. Firmada birden fazla kişiyle iletişim kurabilirsiniz.
        </p>
      ) : (
        <ul className="space-y-3">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3"
            >
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {c.fullName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                    {c.fullName}
                  </span>
                  {c.isPrimary && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Birincil
                    </span>
                  )}
                  {c.role && <span className="text-xs text-slate-500">· {c.role}</span>}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                  {c.phone && (
                    <span className="flex items-center gap-1">
                      <Icon name="phone" size="sm" />
                      {clickToCall ? (
                        <a
                          href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                          className="hover:text-primary"
                        >
                          {c.phone}
                        </a>
                      ) : (
                        c.phone
                      )}
                    </span>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <Icon name="mail" size="sm" />
                      {c.email}
                    </a>
                  )}
                  {c.birthdate && (
                    <span className="flex items-center gap-1">
                      <Icon name="cake" size="sm" />
                      {new Date(c.birthdate).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(c)}
                  className="p-1.5 text-slate-400 hover:text-primary"
                  title="Düzenle"
                >
                  <Icon name="edit" size="sm" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500"
                  title="Sil"
                >
                  <Icon name="delete" size="sm" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ContactEditModal
          customerId={customerId}
          contact={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchContacts();
          }}
        />
      )}
    </Card>
  );
}

function ContactEditModal({
  customerId,
  contact,
  onClose,
  onSaved,
}: {
  customerId: number;
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: contact?.fullName || '',
    role: contact?.role || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    birthdate: contact?.birthdate ? contact.birthdate.split('T')[0] : '',
    notes: contact?.notes || '',
    isPrimary: contact?.isPrimary || false,
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        customerId,
        birthdate: form.birthdate || undefined,
      };
      if (contact) await api.patch(`/customer-contacts/${contact.id}`, payload);
      else await api.post('/customer-contacts', payload);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={contact ? 'Yetkili Düzenle' : 'Yeni Yetkili'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={!form.fullName.trim()}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ad Soyad *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} full />
        <Field label="Görev / Pozisyon" value={form.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="Operasyon, Muhasebe vb." />
        <Field label="Telefon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="E-posta" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        <Field label="Doğum Günü" value={form.birthdate} onChange={(v) => setForm({ ...form, birthdate: v })} type="date" />
        <label className="flex items-center gap-2 col-span-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            className="rounded"
          />
          Birincil yetkili (bu firmadan sadece biri olabilir)
        </label>
      </div>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
      />
    </div>
  );
}
