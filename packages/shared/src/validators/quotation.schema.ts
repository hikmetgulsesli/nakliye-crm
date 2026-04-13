import { z } from 'zod';

export const quotationCreateSchema = z.object({
  customerId: z.number().int().positive('Musteri secimi zorunludur'),
  quoteDate: z.string().min(1, 'Teklif tarihi zorunludur'),
  validityDate: z.string().min(1, 'Gecerlilik tarihi zorunludur'),
  transportMode: z.string().optional(),
  serviceType: z.string().optional(),
  originCountry: z.string().optional(),
  pol: z.string().optional(),
  destinationCountry: z.string().optional(),
  pod: z.string().optional(),
  incoterm: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  priceNote: z.string().optional(),
  status: z.string().optional(),
  lossReason: z.string().optional(),
  assignedUserId: z.number().int().positive('Temsilci secimi zorunludur'),
});

export const quotationUpdateSchema = quotationCreateSchema.partial();

export type QuotationCreateSchemaInput = z.infer<typeof quotationCreateSchema>;
export type QuotationUpdateSchemaInput = z.infer<typeof quotationUpdateSchema>;
