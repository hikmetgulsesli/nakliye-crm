-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  transport_modes JSONB DEFAULT '[]',
  service_types JSONB DEFAULT '[]',
  incoterms JSONB DEFAULT '[]',
  direction JSONB DEFAULT '[]',
  origin_countries JSONB DEFAULT '[]',
  destination_countries JSONB DEFAULT '[]',
  source VARCHAR(100),
  potential VARCHAR(50) CHECK (potential IN ('Dusuk', 'Orta', 'Yuksek')),
  status VARCHAR(50) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif', 'Soguk')),
<<<<<<< HEAD
  assigned_user_id INTEGER REFERENCES users(id),
  last_contact_date DATE,
  last_quote_date DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
=======
  assigned_user_id UUID REFERENCES users(id),
  last_contact_date DATE,
  last_quote_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
>>>>>>> origin/feature/crm-core-modules
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_customers_company_name_trgm ON customers USING gin (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_contact_name_trgm ON customers USING gin (contact_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_potential ON customers(potential);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_user ON customers(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quote_no VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  quote_date DATE DEFAULT CURRENT_DATE,
  validity_date DATE,
  transport_mode VARCHAR(100),
  service_type VARCHAR(100),
  origin_country VARCHAR(100),
  destination_country VARCHAR(100),
  pol VARCHAR(255),
  pod VARCHAR(255),
  incoterm VARCHAR(50),
  price DECIMAL(15, 2),
  currency VARCHAR(10) CHECK (currency IN ('USD', 'EUR', 'TRY')),
  price_note TEXT,
  status VARCHAR(50) DEFAULT 'Bekliyor' CHECK (status IN ('Bekliyor', 'Kazanildi', 'Kaybedildi')),
  loss_reason VARCHAR(100),
<<<<<<< HEAD
  assigned_user_id INTEGER REFERENCES users(id),
  revision_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
=======
  assigned_user_id UUID REFERENCES users(id),
  revision_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
>>>>>>> origin/feature/crm-core-modules
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotation revisions table
CREATE TABLE IF NOT EXISTS quotation_revisions (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  revision_no INTEGER NOT NULL,
  changed_fields JSONB NOT NULL,
<<<<<<< HEAD
  revised_by INTEGER REFERENCES users(id),
=======
  revised_by UUID REFERENCES users(id),
>>>>>>> origin/feature/crm-core-modules
  revised_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) CHECK (activity_type IN ('Telefon', 'E-posta', 'Yuz Yuze', 'Video Gorusme')),
  activity_date TIMESTAMP NOT NULL,
  duration INTEGER,
  notes TEXT,
  outcome VARCHAR(50) CHECK (outcome IN ('Olumlu', 'Notr', 'Olumsuz', 'Teklif Istendi')),
  next_action_date DATE,
<<<<<<< HEAD
  created_by INTEGER REFERENCES users(id),
=======
  created_by UUID REFERENCES users(id),
>>>>>>> origin/feature/crm-core-modules
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lookup values table
CREATE TABLE IF NOT EXISTS lookup_values (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, value)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
<<<<<<< HEAD
  user_id INTEGER REFERENCES users(id),
=======
  user_id UUID REFERENCES users(id),
>>>>>>> origin/feature/crm-core-modules
  record_type VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  forced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
