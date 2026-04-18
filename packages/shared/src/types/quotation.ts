export interface Quotation {
  id: number;
  quoteNo: string;
  customerId: number;
  customer?: { id: number; companyName: string; email?: string; phone?: string; contactName?: string | null };
  quoteDate: string;
  validityDate: string;
  transportMode?: string | null;
  serviceType?: string | null;
  originCountry?: string | null;
  pol?: string | null;
  destinationCountry?: string | null;
  pod?: string | null;
  incoterm?: string | null;
  price?: number | null;
  currency?: string | null;
  priceNote?: string | null;
  status: string;
  lossReason?: string | null;
  assignedUserId: number;
  assignedUser?: { id: number; fullName: string };
  revisionCount: number;
  createdById: number;
  createdBy?: { id: number; fullName: string };
  createdAt: string;
  updatedAt: string;
  revisions?: QuotationRevision[];
}

export interface QuotationCreateInput {
  customerId: number;
  quoteDate: string;
  validityDate: string;
  transportMode?: string;
  serviceType?: string;
  originCountry?: string;
  pol?: string;
  destinationCountry?: string;
  pod?: string;
  incoterm?: string;
  price?: number;
  currency?: string;
  priceNote?: string;
  status?: string;
  lossReason?: string;
  assignedUserId: number;
}

export interface QuotationUpdateInput {
  quoteDate?: string;
  validityDate?: string;
  transportMode?: string;
  serviceType?: string;
  originCountry?: string;
  pol?: string;
  destinationCountry?: string;
  pod?: string;
  incoterm?: string;
  price?: number;
  currency?: string;
  priceNote?: string;
  status?: string;
  lossReason?: string;
  assignedUserId?: number;
}

export interface QuotationRevision {
  id: number;
  quotationId: number;
  revisionNo: number;
  changedFields: Record<string, { old: unknown; new: unknown }>;
  revisedById: number;
  revisedBy?: { id: number; fullName: string };
  revisedAt: string;
}
