import { useState, useEffect } from 'react';
import { Button, Input, Select, Modal } from '@/components/ui';
import type { User, UserCreateInput, UserUpdateInput } from '@nakliye-crm/shared';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit: (data: UserCreateInput | UserUpdateInput) => Promise<void>;
}

export function UserForm({ isOpen, onClose, user, onSubmit }: UserFormProps) {
  const isEditing = !!user;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFullName(user.fullName);
        setEmail(user.email);
        setPhone(user.phone || '');
        setRole(user.role);
        setPassword('');
      } else {
        setFullName('');
        setEmail('');
        setPhone('');
        setRole('USER');
        setPassword('');
      }
      setErrors({});
    }
  }, [isOpen, user]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Ad soyad zorunludur';
    if (!email.trim()) newErrors.email = 'E-posta zorunludur';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Gecerli bir e-posta girin';
    if (!isEditing && !password) newErrors.password = 'Sifre zorunludur';
    if (!isEditing && password && password.length < 6)
      newErrors.password = 'Sifre en az 6 karakter olmali';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEditing) {
        const updateData: UserUpdateInput = {
          fullName: fullName.trim(),
          email: email.trim(),
          role,
        };
        if (phone.trim()) updateData.phone = phone.trim();
        await onSubmit(updateData);
      } else {
        const createData: UserCreateInput = {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
        };
        if (phone.trim()) createData.phone = phone.trim();
        await onSubmit(createData);
      }
      onClose();
    } catch (err) {
      console.error('User form submit error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Kullanici Duzenle' : 'Yeni Kullanici'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Iptal
          </Button>
          <Button
            loading={saving}
            onClick={handleSubmit}
            icon={isEditing ? 'save' : 'person_add'}
          >
            {isEditing ? 'Kaydet' : 'Olustur'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Ad Soyad"
          icon="person"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          placeholder="Ornek: Ahmet Yilmaz"
        />

        <Input
          label="E-posta"
          icon="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="ornek@sirket.com"
        />

        <Input
          label="Telefon"
          icon="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0532 123 4567"
        />

        <Select
          label="Rol"
          icon="shield"
          value={role}
          onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
          options={[
            { value: 'USER', label: 'Kullanici' },
            { value: 'ADMIN', label: 'Admin' },
          ]}
        />

        {!isEditing && (
          <Input
            label="Sifre"
            icon="lock"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="En az 6 karakter"
          />
        )}
      </form>
    </Modal>
  );
}
