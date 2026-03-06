export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  password_hash?: string; // Internal use only (auth)
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface UpdateUserInput {
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface Session {
  user: User;
  expires: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
}

// Customer Types
export type TransportMode = 'Deniz' | 'Hava' | 'Kara' | 'Kombine';
export type ServiceType = 'FCL' | 'LCL' | 'Parsiyel' | 'Komple' | 'Bulk' | 'RoRo';
export type Incoterm = 'FOB' | 'EXW' | 'FCA' | 'DAP' | 'CIF' | 'CFR' | 'DDP';
export type Direction = 'Ithalat' | 'Ihracat';
export type CustomerSource = 'Referans' | 'Soguk arama' | 'Fuar' | 'Dijital';
export type Potential = 'Dusuk' | 'Orta' | 'Yuksek';
export type CustomerStatus = 'Aktif' | 'Pasif' | 'Soguk';

export interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string | null;
  transport_modes: TransportMode[];
  service_types: ServiceType[];
  incoterms: Incoterm[];
  direction: Direction[];
  origin_countries: string[];
  destination_countries: string[];
  source: CustomerSource;
  potential: Potential;
  status: CustomerStatus;
  assigned_user_id: string;
  last_contact_date: string | null;
  last_quote_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithUser extends Customer {
  assigned_user: {
    id: string;
    full_name: string;
  };
  created_by_user: {
    id: string;
    full_name: string;
  };
}

export interface CreateCustomerInput {
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address?: string;
  transport_modes: TransportMode[];
  service_types: ServiceType[];
  incoterms: Incoterm[];
  direction: Direction[];
  origin_countries: string[];
  destination_countries: string[];
  source: CustomerSource;
  potential: Potential;
  status: CustomerStatus;
  assigned_user_id: string;
  notes?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface CustomerConflict {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  matched_field: 'company_name' | 'phone' | 'email';
  match_score: number;
}

// Lookup Values Types
export interface LookupValue {
  id: string;
  category: string;
  value: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type LookupCategory =
  | 'transport_mode'
  | 'service_type'
  | 'incoterm'
  | 'customer_source'
  | 'customer_potential'
  | 'customer_status'
  | 'quote_status'
  | 'loss_reason'
  | 'currency'
  | 'country'
  | 'port';

// Activity Types
export type ActivityType = 'Telefon' | 'E-posta' | 'Yuz Yuze' | 'Video Gorusme';
export type ActivityOutcome = 'Olumlu' | 'Notr' | 'Olumsuz' | 'Teklif Istendi';

export interface Activity {
  id: string;
  customer_id: string;
  type: ActivityType;
  date: string;
  duration: number | null;
  notes: string;
  outcome: ActivityOutcome;
  next_action_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityWithUser extends Activity {
  created_by_user: {
    id: string;
    full_name: string;
  };
}

export interface CreateActivityInput {
  customer_id: string;
  type: ActivityType;
  date: string;
  duration?: number;
  notes: string;
  outcome: ActivityOutcome;
  next_action_date?: string;
}

// Audit Log Types
export type AuditAction = 'create' | 'update' | 'delete' | 'force_create' | 'force_update' | 'transfer';
export type AuditRecordType = 'customer' | 'quotation' | 'activity';

export interface AuditLog {
  id: string;
  user_id: string;
  record_type: AuditRecordType;
  record_id: string;
  action: AuditAction;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogWithUser extends AuditLog {
  user: {
    id: string;
    full_name: string;
  };
}

export interface CreateAuditLogInput {
  user_id: string;
  record_type: AuditRecordType;
  record_id: string;
  action: AuditAction;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
}

// Transfer Types
export type TransferScope = 'all' | 'active' | 'open_quotes';

export interface TransferPreview {
  customers: number;
  quotations: number;
  customers_count: number;
  quotations_count: number;
  source_user_name: string;
  target_user_name: string;
}

export interface BulkTransferResult {
  transferredCustomers: number;
  transferredQuotations: number;
  transferred_customers: number;
  transferred_quotations: number;
  deactivated_user?: boolean;
}

// Dashboard Types
export interface LossReasonAnalysis {
  reason: string;
  count: number;
  percentage: number;
}
