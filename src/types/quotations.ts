import type { User, Customer } from './index.js';

export type QuoteStatus = 'Bekliyor' | 'Kazanildi' | 'Kaybedildi';
export type LossReason = 'Fiyat' | 'Rakip' | 'Gecikmeli donus' | 'Diger';
export type Currency = 'USD' | 'EUR' | 'TRY';

export interface Quotation {
  id: string;
  quote_no: string;
  customer_id: string;
  quote_date: string;
  validity_date: string | null;
  transport_mode: string;
  service_type: string;
  origin_country: string;
  destination_country: string;
  pol: string | null;
  pod: string | null;
  incoterm: string;
  price: number | null;
  currency: Currency | null;
  price_note: string | null;
  status: QuoteStatus;
  loss_reason: LossReason | null;
  assigned_user_id: string;
  revision_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface QuotationWithCustomer extends Quotation {
  customer: {
    id: string;
    company_name: string;
    contact_name: string;
  };
  assigned_user: {
    id: string;
    full_name: string;
  };
  created_by_user: {
    id: string;
    full_name: string;
  };
}

export interface CreateQuotationInput {
  customer_id: string;
  quote_date: string;
  validity_date?: string | null;
  transport_mode: string;
  service_type: string;
  origin_country: string;
  destination_country: string;
  pol?: string | null;
  pod?: string | null;
  incoterm: string;
  price?: number | null;
  currency?: Currency | null;
  price_note?: string | null;
  status?: QuoteStatus;
  loss_reason?: LossReason | null;
  assigned_user_id: string;
}

export type UpdateQuotationInput = Partial<CreateQuotationInput>;

export interface QuotationRevision {
  id: string;
  quotation_id: string;
  revision_no: number;
  changed_fields: RevisionChange[];
  revised_by: string;
  revised_at: string;
}

export interface RevisionChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

export interface QuotationRevisionWithUser extends QuotationRevision {
  revised_by_user: {
    id: string;
    full_name: string;
  };
}

export interface QuotationFilters {
  status?: QuoteStatus;
  customer_id?: string;
  assigned_user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  include_deleted?: boolean;
}

// Re-export types used from index.ts for convenience
export type { User, Customer };
