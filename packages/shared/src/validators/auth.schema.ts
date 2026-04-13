import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Gecerli bir e-posta adresi giriniz'),
  password: z.string().min(8, 'Sifre en az 8 karakter olmalidir'),
  rememberMe: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut sifre gereklidir'),
  newPassword: z
    .string()
    .min(8, 'Sifre en az 8 karakter olmalidir')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Sifre en az 1 ozel karakter icermelidir'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Sifreler eslesmiyor',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
