import { z } from 'zod';

export function splitMultiValue(input: string): string[] {
  return input
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

const multiPhoneSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v.length > 0, 'Geçerli bir telefon numarasi giriniz')
  .refine((v) => {
    const parts = splitMultiValue(v);
    if (parts.length === 0) return false;
    return parts.every((p) => p.replace(/[\s\-()]/g, '').length >= 10);
  }, 'Geçerli bir telefon numarasi giriniz (birden fazlaysa virgülle ayırın)');

const multiEmailSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v.length > 0, 'Geçerli bir e-posta adresi giriniz')
  .refine((v) => {
    const parts = splitMultiValue(v);
    if (parts.length === 0) return false;
    return parts.every((p) => z.string().email().safeParse(p).success);
  }, 'Geçerli bir e-posta adresi giriniz (birden fazlaysa virgülle ayırın)');

export const customerCreateSchema = z.object({
  companyName: z.string().min(2, 'Firma adı en az 2 karakter olmalidir'),
  contactName: z.string().optional(),
  phone: multiPhoneSchema,
  email: multiEmailSchema,
  address: z.string().optional(),
  transportModes: z.array(z.string()).optional(),
  serviceTypes: z.array(z.string()).optional(),
  incoterms: z.array(z.string()).optional(),
  direction: z.string().optional(),
  originCountries: z.array(z.string()).optional(),
  destinationCountries: z.array(z.string()).optional(),
  source: z.string().optional(),
  potential: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  assignedUserId: z.number().int().positive('Temsilci seçimi zorunludur'),
  forceCreate: z.boolean().optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial().omit({ forceCreate: true });

export type CustomerCreateSchemaInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateSchemaInput = z.infer<typeof customerUpdateSchema>;
