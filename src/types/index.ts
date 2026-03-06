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
  requiredRole?: UserRole;
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ============================================
// Admin Dashboard Types
// ============================================

export interface AdminDashboardMetrics {
  totalQuotes: number;
  winRate: number;
  activeCustomers: number;
  highPotentialCustomers: number;
  totalRevenue: number;
  pendingQuotes: number;
  wonQuotes: number;
  lostQuotes: number;
}

export interface PersonnelPerformance {
  userId: number;
  userName: string;
  totalQuotes: number;
  wonQuotes: number;
  lostQuotes: number;
  winRate: number;
  totalRevenue: number;
  avgQuoteValue: number;
}

export interface CountryVolume {
  country: string;
  count: number;
  percentage: number;
}

export interface ModeDistribution {
  mode: string;
  count: number;
  percentage: number;
}

export interface LossReasonDistribution {
  reason: string;
  count: number;
  percentage: number;
}

export interface AdminDashboardData {
  metrics: AdminDashboardMetrics;
  personnelPerformance: PersonnelPerformance[];
  originCountries: CountryVolume[];
  destinationCountries: CountryVolume[];
  modeDistribution: ModeDistribution[];
  lossReasons: LossReasonDistribution[];
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

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  entity_type: 'customer' | 'quotation';
  entity_id: string;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Report Types
// ============================================

export type ReportType = 'period' | 'performance' | 'won-lost' | 'country-volume';
export type QuotationStatus = 'pending' | 'won' | 'lost';
export type LossReason = 'price' | 'competitor' | 'delayed' | 'other';
export type Currency = 'USD' | 'EUR' | 'TRY';

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
