import { z } from 'zod';

export const customerSchema = z.object({
  company_name: z.string().min(1, 'Firma adı zorunludur').max(255),
  contact_name: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').max(255).optional().nullable(),
  address: z.string().optional().nullable(),
  transport_modes: z.array(z.string()).default([]),
  service_types: z.array(z.string()).default([]),
  incoterms: z.array(z.string()).default([]),
  direction: z.array(z.enum(['Ithalat', 'Ihracat'])).default([]),
  origin_countries: z.array(z.string()).default([]),
  destination_countries: z.array(z.string()).default([]),
  source: z.string().max(100).optional().nullable(),
  potential: z.enum(['Dusuk', 'Orta', 'Yuksek']).optional().nullable(),
  status: z.enum(['Aktif', 'Pasif', 'Soguk']).default('Aktif'),
  assigned_user_id: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const customerUpdateSchema = customerSchema.partial();

export const customerFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['Aktif', 'Pasif', 'Soguk']).optional(),
  potential: z.enum(['Dusuk', 'Orta', 'Yuksek']).optional(),
  source: z.string().optional(),
  assigned_user_id: z.coerce.number().int().positive().optional(),
  transport_mode: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const conflictCheckSchema = z.object({
  company_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  exclude_id: z.coerce.number().int().positive().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type CustomerFilter = z.infer<typeof customerFilterSchema>;
export type ConflictCheckInput = z.infer<typeof conflictCheckSchema>;
