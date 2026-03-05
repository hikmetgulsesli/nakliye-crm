// ============================================
// Nakliye CRM Type Definitions
// ============================================

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Create user input
export interface CreateUserInput {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

// Update user input
export interface UpdateUserInput {
  email?: string;
  full_name?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CustomerStatus = "active" | "inactive" | "cold";
export type CustomerPotential = "low" | "medium" | "high";
export type Direction = "import" | "export" | "both";

export interface Customer {
  id: number;
  company_name: string;
  contact_name: string | null;
  phone: string;
  email: string;
  address: string | null;
  transport_modes: string[] | null; // JSON array
  service_types: string[] | null; // JSON array
  incoterms: string[] | null; // JSON array
  direction: Direction | null;
  origin_countries: string[] | null; // JSON array
  destination_countries: string[] | null; // JSON array
  source: string | null;
  potential: CustomerPotential | null;
  status: CustomerStatus;
  assigned_user_id: number | null;
  last_contact_date: string | null;
  last_quote_date: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export type QuotationStatus = "pending" | "won" | "lost";
export type LossReason = "price" | "competitor" | "delayed" | "other";
export type Currency = "USD" | "EUR" | "TRY";

export interface Quotation {
  id: number;
  quote_no: string;
  customer_id: number;
  quote_date: string;
  validity_date: string | null;
  transport_mode: string | null;
  service_type: string | null;
  origin_country: string | null;
  destination_country: string | null;
  pol: string | null; // Port of Loading
  pod: string | null; // Port of Discharge
  incoterm: string | null;
  price: number | null;
  currency: Currency | null;
  price_note: string | null;
  status: QuotationStatus;
  loss_reason: LossReason | null;
  assigned_user_id: number | null;
  revision_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface QuotationRevision {
  id: number;
  quotation_id: number;
  revision_no: number;
  changed_fields: Record<string, { old: unknown; new: unknown }>; // JSON
  revised_by: number;
  revised_at: string;
}

export type ActivityType = "phone" | "email" | "meeting" | "video";
export type ActivityOutcome = "positive" | "neutral" | "negative" | "quote_requested";

export interface Activity {
  id: number;
  customer_id: number;
  type: ActivityType;
  activity_date: string;
  duration: number | null; // in minutes
  notes: string | null;
  outcome: ActivityOutcome | null;
  next_action_date: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface LookupValue {
  id: number;
  category: string;
  value: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AuditAction = "create" | "update" | "delete" | "force_create";

export interface AuditLog {
  id: number;
  user_id: number | null;
  record_type: "customer" | "quotation" | "activity" | "user";
  record_id: number;
  action: AuditAction;
  changes: Record<string, { old: unknown; new: unknown }>; // JSON
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Navigation item for sidebar
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
