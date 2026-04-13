import { z } from 'zod';

export const customerCreateSchema = z.object({
  companyName: z.string().min(2, 'Firma adi en az 2 karakter olmalidir'),
  contactName: z.string().optional(),
  phone: z.string().min(10, 'Gecerli bir telefon numarasi giriniz'),
  email: z.string().email('Gecerli bir e-posta adresi giriniz'),
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
  assignedUserId: z.number().int().positive('Temsilci secimi zorunludur'),
  forceCreate: z.boolean().optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial().omit({ forceCreate: true });

export type CustomerCreateSchemaInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateSchemaInput = z.infer<typeof customerUpdateSchema>;
