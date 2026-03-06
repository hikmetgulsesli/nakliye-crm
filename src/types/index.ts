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

// Re-export quotation types
export * from './quotations.js';

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
  duration?: number | null;
  notes: string;
  outcome: ActivityOutcome;
  next_action_date?: string | null;
}

export type UpdateActivityInput = Partial<CreateActivityInput>;

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id: string;
  record_type: string;
  record_id: string;
  action: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata?: Record<string, unknown> | null;
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
  record_type: string;
  record_id: string;
  action: string;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
  metadata?: Record<string, unknown>;
}

// Transfer System Types
export type TransferScope = 'all' | 'active' | 'open_quotes';

export interface TransferPreview {
  source_user_name: string;
  target_user_name: string;
  customers_count: number;
  quotations_count: number;
}

export interface BulkTransferResult {
  success: boolean;
  transferred_customers: number;
  transferred_quotations: number;
  deactivated_user?: boolean;
  errors?: string[];
}

// Dashboard Types
export interface LossReasonAnalysis {
  reason: string;
  count: number;
  percentage: number;
}

export interface SingleTransferInput {
  customer_id: string;
  from_user_id: string;
  to_user_id: string;
  reason: string;
  cascade_to_open_quotes: boolean;
}

export interface BulkTransferInput {
  from_user_id: string;
  to_user_id: string;
  scope: TransferScope;
  deactivate_source: boolean;
}

// ============================================
// User Dashboard Types
// ============================================

export interface UserDashboardMetrics {
  quotesThisWeek: number;
  quotesThisMonth: number;
  wonQuotesThisMonth: number;
  winRateThisMonth: number;
  customersContactedThisMonth: number;
  pendingQuotes: number;
  activeCustomersAssigned: number;
  activitiesThisWeek: number;
}

export interface UpcomingFollowUp {
  id: string;
  customerId: string;
  customerName: string;
  nextActionDate: string;
  notes: string;
  lastContactDate: string;
}

export interface RecentActivity {
  id: string;
  customerId: string;
  customerName: string;
  type: string;
  typeLabel: string;
  activityDate: string;
  outcome: string | null;
  outcomeLabel: string | null;
  notes: string;
  createdAt: string;
}

export interface UserDashboardData {
  metrics: UserDashboardMetrics;
  upcomingFollowUps: UpcomingFollowUp[];
  recentActivities: RecentActivity[];
}

// ============================================
// Alert Types
// ============================================

export type AlertType = 'no_contact_14d' | 'pending_quote_7d' | 'expired_quote' | 'high_potential_no_quote_30d';
export type AlertSeverity = 'low' | 'medium' | 'high';
export type AlertStatus = 'active' | 'reviewed' | 'dismissed';

export interface AlertCounts {
  no_contact_14d: number;
  pending_quote_7d: number;
  expired_quote: number;
  high_potential_no_quote_30d: number;
  total: number;
}

// ============================================
// Report Types
// ============================================

export type ReportType = 'period' | 'performance' | 'won-lost' | 'country-volume';

export interface PeriodReportFilters {
  startDate: string;
  endDate: string;
  status?: QuotationStatus;
  assignedUserId?: number;
  currency?: Currency;
}

export interface PeriodReportStats {
  totalQuotations: number;
  totalValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  pendingCount: number;
  pendingValue: number;
  winRate: number;
}

export interface PeriodReportRow {
  id: number;
  quote_no: string;
  quote_date: string;
  customer_name: string;
  transport_mode: string | null;
  origin_country: string | null;
  destination_country: string | null;
  price: number | null;
  currency: Currency | null;
  status: QuotationStatus;
  loss_reason: LossReason | null;
  assigned_user_name: string | null;
}

export interface PerformanceReportRow {
  user_id: number;
  user_name: string;
  totalQuotations: number;
  totalValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  pendingCount: number;
  winRate: number;
  avgQuoteValue: number;
}

export interface WonLostAnalysis {
  totalQuotes: number;
  wonCount: number;
  lostCount: number;
  wonPercentage: number;
  lostPercentage: number;
  byLossReason: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  byMonth: {
    month: string;
    won: number;
    lost: number;
    pending: number;
  }[];
}

export interface CountryVolumeReport {
  originCountries: {
    country: string;
    count: number;
    percentage: number;
  }[];
  destinationCountries: {
    country: string;
    count: number;
    percentage: number;
  }[];
  modeDistribution: {
    mode: string;
    count: number;
    percentage: number;
  }[];
  combinations: {
    origin: string;
    destination: string;
    mode: string;
    count: number;
  }[];
}

export interface SavedReport {
  id: number;
  user_id: number;
  report_type: ReportType;
  name: string;
  params: Record<string, unknown>;
  created_at: string;
}

export interface ReportExportData {
  title: string;
  generatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: Record<string, unknown>;
  summary: Record<string, unknown>;
  rows: Record<string, unknown>[];
}
