-- ============================================
-- Nakliye CRM Database Schema
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  transport_modes TEXT, -- JSON array
  service_types TEXT, -- JSON array
  incoterms TEXT, -- JSON array
  direction TEXT CHECK (direction IN ('import', 'export', 'both')),
  origin_countries TEXT, -- JSON array
  destination_countries TEXT, -- JSON array
  source TEXT,
  potential TEXT CHECK (potential IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cold')),
  assigned_user_id INTEGER,
  last_contact_date DATE,
  last_quote_date DATE,
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_no TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  validity_date DATE,
  transport_mode TEXT,
  service_type TEXT,
  origin_country TEXT,
  destination_country TEXT,
  pol TEXT, -- Port of Loading
  pod TEXT, -- Port of Discharge
  incoterm TEXT,
  price REAL,
  currency TEXT CHECK (currency IN ('USD', 'EUR', 'TRY')),
  price_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  loss_reason TEXT CHECK (loss_reason IN ('price', 'competitor', 'delayed', 'other')),
  assigned_user_id INTEGER,
  revision_count INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Quotation Revisions table
CREATE TABLE IF NOT EXISTS quotation_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  revision_no INTEGER NOT NULL,
  changed_fields TEXT NOT NULL, -- JSON with old and new values
  revised_by INTEGER NOT NULL,
  revised_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (revised_by) REFERENCES users(id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('phone', 'email', 'meeting', 'video')),
  activity_date DATETIME NOT NULL,
  duration INTEGER, -- in minutes
  notes TEXT,
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative', 'quote_requested')),
  next_action_date DATE,
  created_by INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Lookup Values table (dynamic dropdown values)
CREATE TABLE IF NOT EXISTS lookup_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, value)
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  record_type TEXT NOT NULL, -- 'customer', 'quotation', 'activity', 'user'
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'force_create')),
  changes TEXT NOT NULL, -- JSON with old and new values
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_assigned_user ON customers(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_assigned_user ON quotations(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_quote_no ON quotations(quote_no);
CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_lookup_category ON lookup_values(category);
CREATE INDEX IF NOT EXISTS idx_lookup_active ON lookup_values(category, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
