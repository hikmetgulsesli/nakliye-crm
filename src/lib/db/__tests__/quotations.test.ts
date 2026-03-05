import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import DatabaseConstructor from 'better-sqlite3';
import * as quotations from '../quotations';
// customers module imported when needed

// Set up test database
process.env.DATABASE_PATH = ':memory:';

const TEST_USER_ID = 'test-user-id';
const TEST_CUSTOMER_ID = 'test-customer-id';

describe('Quotations DB', () => {
  let db: import('better-sqlite3').Database;

  beforeAll(() => {
    // Initialize database
    db = new DatabaseConstructor(':memory:');
    
    // Create users table for foreign key references
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Insert test user
    db.exec(`
      INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES ('${TEST_USER_ID}', 'test@example.com', 'hash', 'Test User', 'user', 1, datetime('now'), datetime('now'))
    `);
  });

  beforeEach(() => {
    // Reset tables
    db.exec('DELETE FROM quotations');
    db.exec('DELETE FROM customers');
    
    // Insert test customer
    db.exec(`
      INSERT INTO customers (
        id, company_name, contact_name, phone, email, address,
        transport_modes, service_types, incoterms, direction,
        origin_countries, destination_countries, source, potential,
        status, assigned_user_id, last_contact_date, last_quote_date,
        notes, created_by, created_at, updated_at
      ) VALUES (
        '${TEST_CUSTOMER_ID}', 'Test Company', 'John Doe', '5551234567', 'test@company.com', NULL,
        '["Deniz"]', '["FCL"]', '["FOB"]', '["Ihracat"]',
        '["Turkiye"]', '["Almanya"]', 'Dijital', 'Orta',
        'Aktif', '${TEST_USER_ID}', NULL, NULL,
        NULL, '${TEST_USER_ID}', datetime('now'), datetime('now')
      )
    `);
  });

  describe('generateQuoteNumber', () => {
    it('should generate first quote number for year', () => {
      const year = new Date().getFullYear();
      const quoteNo = quotations.generateQuoteNumber();
      expect(quoteNo).toBe(`TKF-${year}-0001`);
    });

    it('should generate sequential quote numbers', () => {
      const year = new Date().getFullYear();
      
      // Create first quotation
      quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      // Second should be 0002
      const quoteNo = quotations.generateQuoteNumber();
      expect(quoteNo).toBe(`TKF-${year}-0002`);
    });
  });

  describe('createQuotation', () => {
    it('should create a quotation with all fields', () => {
      const input = {
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        validity_date: '2026-03-20',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        pol: 'Istanbul',
        pod: 'Hamburg',
        incoterm: 'FOB',
        price: 5000,
        currency: 'USD' as const,
        price_note: 'Test note',
        status: 'Bekliyor' as const,
        assigned_user_id: TEST_USER_ID,
      };

      const quotation = quotations.createQuotation(input, TEST_USER_ID);

      expect(quotation.id).toBeDefined();
      expect(quotation.quote_no).toMatch(/^TKF-\d{4}-\d{4}$/);
      expect(quotation.customer_id).toBe(TEST_CUSTOMER_ID);
      expect(quotation.quote_date).toBe('2026-03-06');
      expect(quotation.validity_date).toBe('2026-03-20');
      expect(quotation.transport_mode).toBe('Deniz');
      expect(quotation.service_type).toBe('FCL');
      expect(quotation.origin_country).toBe('Turkiye');
      expect(quotation.destination_country).toBe('Almanya');
      expect(quotation.pol).toBe('Istanbul');
      expect(quotation.pod).toBe('Hamburg');
      expect(quotation.incoterm).toBe('FOB');
      expect(quotation.price).toBe(5000);
      expect(quotation.currency).toBe('USD');
      expect(quotation.price_note).toBe('Test note');
      expect(quotation.status).toBe('Bekliyor');
      expect(quotation.assigned_user_id).toBe(TEST_USER_ID);
      expect(quotation.revision_count).toBe(0);
      expect(quotation.created_by).toBe(TEST_USER_ID);
      expect(quotation.deleted_at).toBeNull();
    });

    it('should create a quotation with minimal fields', () => {
      const input = {
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      };

      const quotation = quotations.createQuotation(input, TEST_USER_ID);

      expect(quotation.quote_no).toBeDefined();
      expect(quotation.status).toBe('Bekliyor');
      expect(quotation.revision_count).toBe(0);
      expect(quotation.deleted_at).toBeNull();
    });
  });

  describe('getQuotationById', () => {
    it('should return null for non-existent quotation', () => {
      const result = quotations.getQuotationById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return quotation by id', () => {
      const created = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const found = quotations.getQuotationById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.quote_no).toBe(created.quote_no);
    });

    it('should not return soft-deleted quotation by default', () => {
      const created = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      quotations.softDeleteQuotation(created.id);

      const found = quotations.getQuotationById(created.id);
      expect(found).toBeNull();
    });

    it('should return soft-deleted quotation when includeDeleted is true', () => {
      const created = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      quotations.softDeleteQuotation(created.id);

      const found = quotations.getQuotationById(created.id, true);
      expect(found).toBeDefined();
      expect(found?.deleted_at).not.toBeNull();
    });
  });

  describe('getQuotations', () => {
    it('should return all non-deleted quotations', () => {
      quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-07',
        transport_mode: 'Hava',
        service_type: 'LCL',
        origin_country: 'Turkiye',
        destination_country: 'Fransa',
        incoterm: 'CIF',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const results = quotations.getQuotations();
      expect(results).toHaveLength(2);
    });

    it('should filter by status', () => {
      quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        status: 'Bekliyor',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-07',
        transport_mode: 'Hava',
        service_type: 'LCL',
        origin_country: 'Turkiye',
        destination_country: 'Fransa',
        incoterm: 'CIF',
        status: 'Kazanildi',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const results = quotations.getQuotations({ status: 'Kazanildi' });
      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe('Kazanildi');
    });

    it('should filter by customer_id', () => {
      // Create second customer
      db.exec(`
        INSERT INTO customers (id, company_name, contact_name, phone, email, address,
          transport_modes, service_types, incoterms, direction,
          origin_countries, destination_countries, source, potential,
          status, assigned_user_id, last_contact_date, last_quote_date,
          notes, created_by, created_at, updated_at)
        VALUES ('customer-2', 'Company 2', 'Jane Doe', '5559998888', 'jane@company.com', NULL,
          '["Hava"]', '["LCL"]', '["CIF"]', '["Ithalat"]',
          '["Almanya"]', '["Turkiye"]', 'Referans', 'Yuksek',
          'Aktif', '${TEST_USER_ID}', NULL, NULL,
          NULL, '${TEST_USER_ID}', datetime('now'), datetime('now'))
      `);

      quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      quotations.createQuotation({
        customer_id: 'customer-2',
        quote_date: '2026-03-07',
        transport_mode: 'Hava',
        service_type: 'LCL',
        origin_country: 'Almanya',
        destination_country: 'Turkiye',
        incoterm: 'CIF',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const results = quotations.getQuotations({ customer_id: TEST_CUSTOMER_ID });
      expect(results).toHaveLength(1);
      expect(results[0]?.customer_id).toBe(TEST_CUSTOMER_ID);
    });

    it('should search by quote number', () => {
      const created = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const results = quotations.getQuotations({ search: created.quote_no });
      expect(results).toHaveLength(1);
      expect(results[0]?.quote_no).toBe(created.quote_no);
    });
  });

  describe('updateQuotation', () => {
    it('should update quotation fields', () => {
      const created = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        status: 'Bekliyor',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const updated = quotations.updateQuotation(created.id, {
        status: 'Kazanildi',
        price: 10000,
        currency: 'EUR',
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('Kazanildi');
      expect(updated?.price).toBe(10000);
      expect(updated?.currency).toBe('EUR');
      expect(updated?.quote_no).toBe(created.quote_no); // Unchanged
    });

    it('should return null for non-existent quotation', () => {
      const updated = quotations.updateQuotation('non-existent', { status: 'Kazanildi' });
      expect(updated).toBeNull();
    });
  });

  describe('softDeleteQuotation', () => {
    it('should soft delete a quotation', () => {
      const created = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const success = quotations.softDeleteQuotation(created.id);
      expect(success).toBe(true);

      const found = quotations.getQuotationById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent quotation', () => {
      const success = quotations.softDeleteQuotation('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('restoreQuotation', () => {
    it('should restore a soft-deleted quotation', () => {
      const created = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      quotations.softDeleteQuotation(created.id);
      
      const success = quotations.restoreQuotation(created.id);
      expect(success).toBe(true);

      const found = quotations.getQuotationById(created.id);
      expect(found).toBeDefined();
      expect(found?.deleted_at).toBeNull();
    });
  });

  describe('incrementRevisionCount', () => {
    it('should increment revision count', () => {
      const created = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      expect(created.revision_count).toBe(0);

      quotations.incrementRevisionCount(created.id);

      const found = quotations.getQuotationById(created.id);
      expect(found?.revision_count).toBe(1);
    });
  });
});
