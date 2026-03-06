import { z } from 'zod';

// User role enumeration
export const UserRoleEnum = z.enum(['admin', 'user']);

// Create user schema
export const createUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Şifre en az bir özel karakter içermelidir'),
  role: UserRoleEnum,
});

// Update user schema
export const updateUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional(),
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır').optional(),
  role: UserRoleEnum.optional(),
  is_active: z.boolean().optional(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
  newPassword: z
    .string()
    .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Yeni şifre en az bir özel karakter içermelidir'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Export types
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
