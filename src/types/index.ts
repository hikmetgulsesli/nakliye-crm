export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// Quotation Types
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
  customer: {
    id: string;
    company_name: string;
  };
  created_by_user: {
    id: string;
    full_name: string;
  };
}

export interface CreateActivityInput {
  customer_id: string;
  type: ActivityType;
  date: string;
  duration?: number | null;
  notes: string;
  outcome: ActivityOutcome;
  next_action_date?: string | null;
}

// Dashboard Types
export interface DashboardMetrics {
  totalQuotes: number;
  wonQuotes: number;
  lostQuotes: number;
  winRate: number;
  activeCustomers: number;
  highPotentialCustomers: number;
  totalRevenue: number;
}

export interface PersonnelPerformance {
  userId: string;
  fullName: string;
  totalQuotes: number;
  wonQuotes: number;
  lostQuotes: number;
  winRate: number;
  totalRevenue: number;
}

export interface CountryVolume {
  country: string;
  count: number;
}

export interface TransportModeDistribution {
  mode: string;
  count: number;
}

export interface LossReasonAnalysis {
  reason: string;
  count: number;
  percentage: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  personnelPerformance: PersonnelPerformance[];
  topOriginCountries: CountryVolume[];
  topDestinationCountries: CountryVolume[];
  transportModeDistribution: TransportModeDistribution[];
  lossReasonAnalysis: LossReasonAnalysis[];
  dateRange: {
    from: string;
    to: string;
  };
}
