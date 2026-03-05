'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types';

const createUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  full_name: z.string().min(2, 'Ad soyad gereklidir'),
  role: z.enum(['admin', 'user']),
});

const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Ad soyad gereklidir'),
  role: z.enum(['admin', 'user']),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface CreateUserFormProps {
  user?: never;
  onSubmit: (data: CreateUserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface UpdateUserFormProps {
  user: User;
  onSubmit: (data: UpdateUserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type UserFormProps = CreateUserFormProps | UpdateUserFormProps;

export function UserForm(props: UserFormProps) {
  const { user, onSubmit, onCancel, isLoading } = props;
  const isEditing = !!user;
  
  if (isEditing) {
    return (
      <UpdateUserForm
        user={user}
        onSubmit={onSubmit as (data: UpdateUserFormData) => void}
        onCancel={onCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <CreateUserForm
      onSubmit={onSubmit as (data: CreateUserFormData) => void}
      onCancel={onCancel}
      isLoading={isLoading}
    />
  );
}

function CreateUserForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: CreateUserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      role: 'user',
    },
  });

  const role = watch('role');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="kullanici@example.com"
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          placeholder="Ali Veli"
        />
        {errors.full_name && (
          <p className="text-sm text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={role}
          onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Rol seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Kullanıcı</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Kaydediliyor...' : 'Oluştur'}
        </Button>
      </div>
    </form>
  );
}

function UpdateUserForm({
  user,
  onSubmit,
  onCancel,
  isLoading,
}: {
  user: User;
  onSubmit: (data: UpdateUserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      full_name: user.full_name,
      role: user.role,
    },
  });

  const role = watch('role');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          placeholder="Ali Veli"
        />
        {errors.full_name && (
          <p className="text-sm text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={role}
          onValueChange={(value: 'admin' | 'user') => setValue('role', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Rol seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Kullanıcı</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Kaydediliyor...' : 'Güncelle'}
        </Button>
      </div>
    </form>
  );
}
