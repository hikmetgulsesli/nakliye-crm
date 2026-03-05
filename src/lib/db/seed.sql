-- ============================================
-- Nakliye CRM Lookup Values Seed Data
-- ============================================

-- Transport Modes
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('transport_mode', 'sea', 'Deniz', 1),
  ('transport_mode', 'air', 'Hava', 2),
  ('transport_mode', 'road', 'Kara', 3),
  ('transport_mode', 'rail', 'Demiryolu', 4),
  ('transport_mode', 'combined', 'Kombine', 5);

-- Service Types
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('service_type', 'fcl', 'FCL (Tam Konteyner)', 1),
  ('service_type', 'lcl', 'LCL (Parsiyel)', 2),
  ('service_type', 'partial', 'Parsiyel', 3),
  ('service_type', 'full', 'Komple', 4),
  ('service_type', 'bulk', 'Bulk', 5),
  ('service_type', 'roro', 'RoRo', 6);

-- Incoterms
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('incoterm', 'fob', 'FOB', 1),
  ('incoterm', 'exw', 'EXW', 2),
  ('incoterm', 'fca', 'FCA', 3),
  ('incoterm', 'dap', 'DAP', 4),
  ('incoterm', 'cif', 'CIF', 5),
  ('incoterm', 'cfr', 'CFR', 6),
  ('incoterm', 'ddp', 'DDP', 7);

-- Customer Sources
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('customer_source', 'referral', 'Referans', 1),
  ('customer_source', 'cold_call', 'Soğuk Arama', 2),
  ('customer_source', 'fair', 'Fuar', 3),
  ('customer_source', 'digital', 'Dijital', 4),
  ('customer_source', 'other', 'Diğer', 5);

-- Customer Potential
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('potential', 'low', 'Düşük', 1),
  ('potential', 'medium', 'Orta', 2),
  ('potential', 'high', 'Yüksek', 3);

-- Customer Status
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('customer_status', 'active', 'Aktif', 1),
  ('customer_status', 'inactive', 'Pasif', 2),
  ('customer_status', 'cold', 'Soğuk', 3);

-- Quotation Status
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('quotation_status', 'pending', 'Bekliyor', 1),
  ('quotation_status', 'won', 'Kazanıldı', 2),
  ('quotation_status', 'lost', 'Kaybedildi', 3);

-- Loss Reasons
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('loss_reason', 'price', 'Fiyat', 1),
  ('loss_reason', 'competitor', 'Rakip', 2),
  ('loss_reason', 'delayed', 'Gecikmeli Dönüş', 3),
  ('loss_reason', 'other', 'Diğer', 4);

-- Currencies
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('currency', 'USD', 'USD', 1),
  ('currency', 'EUR', 'EUR', 2),
  ('currency', 'TRY', 'TRY', 3);

-- Activity Types
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('activity_type', 'phone', 'Telefon', 1),
  ('activity_type', 'email', 'E-posta', 2),
  ('activity_type', 'meeting', 'Yüz Yüze', 3),
  ('activity_type', 'video', 'Video Görüşme', 4);

-- Activity Outcomes
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('activity_outcome', 'positive', 'Olumlu', 1),
  ('activity_outcome', 'neutral', 'Nötr', 2),
  ('activity_outcome', 'negative', 'Olumsuz', 3),
  ('activity_outcome', 'quote_requested', 'Teklif İstendi', 4);

-- User Roles
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('user_role', 'admin', 'Yönetici', 1),
  ('user_role', 'user', 'Kullanıcı', 2);

-- Direction
INSERT INTO lookup_values (category, value, label, sort_order) VALUES
  ('direction', 'import', 'İthalat', 1),
  ('direction', 'export', 'İhracat', 2),
  ('direction', 'both', 'Her İkisi', 3);
