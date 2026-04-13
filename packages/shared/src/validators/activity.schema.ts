import { z } from 'zod';

export const activityCreateSchema = z.object({
  customerId: z.number().int().positive('Musteri secimi zorunludur'),
  activityType: z.string().min(1, 'Aktivite tipi zorunludur'),
  activityDate: z.string().min(1, 'Tarih zorunludur'),
  durationMinutes: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  nextActionDate: z.string().optional(),
});

export type ActivityCreateSchemaInput = z.infer<typeof activityCreateSchema>;
