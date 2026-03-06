import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import DatabaseConstructor from 'better-sqlite3';
import * as quotationRevisions from '../quotation-revisions';
import * as quotations from '../quotations';

// Set up test database
process.env.DATABASE_PATH = ':memory:';

const TEST_USER_ID = 'test-user-id';
const TEST_CUSTOMER_ID = 'test-customer-id';

describe('QuotationRevisions DB', () => {
  let db: import('better-sqlite3').Database;

  beforeAll(() => {
    // Initialize database
    db = new DatabaseConstructor(':memory:');
    
    // Create users table
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

    // Create customers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT,
        transport_modes TEXT NOT NULL,
        service_types TEXT NOT NULL,
        incoterms TEXT NOT NULL,
        direction TEXT NOT NULL,
        origin_countries TEXT NOT NULL,
        destination_countries TEXT NOT NULL,
        source TEXT NOT NULL,
        potential TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_user_id TEXT NOT NULL,
        last_contact_date TEXT,
        last_quote_date TEXT,
        notes TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create quotations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        quote_no TEXT NOT NULL UNIQUE,
        customer_id TEXT NOT NULL,
        quote_date TEXT NOT NULL,
        valid_until TEXT,
        transport_mode TEXT NOT NULL,
        service_type TEXT NOT NULL,
        origin_country TEXT NOT NULL,
        destination_country TEXT NOT NULL,
        pol TEXT,
        pod TEXT,
        incoterm TEXT NOT NULL,
        price REAL,
        currency TEXT,
        price_note TEXT,
        status TEXT NOT NULL DEFAULT 'Bekliyor',
        loss_reason TEXT,
        assigned_user_id TEXT NOT NULL,
        revision_count INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
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
    db.exec('DELETE FROM quotation_revisions');
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

  describe('createRevision', () => {
    it('should create a revision with field changes', () => {
      const quotation = quotations.createQuotation({
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

      const changes = [
        { field: 'status', old_value: 'Bekliyor', new_value: 'Kazanildi' },
        { field: 'price', old_value: null, new_value: 5000 },
      ];

      const revision = quotationRevisions.createRevision(quotation.id, changes, TEST_USER_ID);

      expect(revision.id).toBeDefined();
      expect(revision.quotation_id).toBe(quotation.id);
      expect(revision.revision_no).toBe(1);
      expect(revision.changed_fields).toEqual(changes);
      expect(revision.revised_by).toBe(TEST_USER_ID);
      expect(revision.revised_at).toBeDefined();
    });

    it('should auto-increment revision numbers', () => {
      const quotation = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const changes1 = [{ field: 'status', old_value: 'Bekliyor', new_value: 'Kazanildi' }];
      const changes2 = [{ field: 'price', old_value: null, new_value: 5000 }];

      const revision1 = quotationRevisions.createRevision(quotation.id, changes1, TEST_USER_ID);
      const revision2 = quotationRevisions.createRevision(quotation.id, changes2, TEST_USER_ID);

      expect(revision1.revision_no).toBe(1);
      expect(revision2.revision_no).toBe(2);
    });
  });

  describe('getRevisionsByQuotationId', () => {
    it('should return all revisions for a quotation', () => {
      const quotation = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const changes1 = [{ field: 'status', old_value: 'Bekliyor', new_value: 'Kazanildi' }];
      const changes2 = [{ field: 'price', old_value: null, new_value: 5000 }];

      quotationRevisions.createRevision(quotation.id, changes1, TEST_USER_ID);
      quotationRevisions.createRevision(quotation.id, changes2, TEST_USER_ID);

      const revisions = quotationRevisions.getRevisionsByQuotationId(quotation.id);

      expect(revisions).toHaveLength(2);
      expect(revisions[0]?.revision_no).toBe(1);
      expect(revisions[1]?.revision_no).toBe(2);
    });

    it('should include user info in revisions', () => {
      const quotation = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const changes = [{ field: 'status', old_value: 'Bekliyor', new_value: 'Kazanildi' }];
      quotationRevisions.createRevision(quotation.id, changes, TEST_USER_ID);

      const revisions = quotationRevisions.getRevisionsByQuotationId(quotation.id);

      expect(revisions[0]?.revised_by_user).toBeDefined();
      expect(revisions[0]?.revised_by_user.full_name).toBe('Test User');
    });

    it('should return empty array for quotation with no revisions', () => {
      const quotation = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const revisions = quotationRevisions.getRevisionsByQuotationId(quotation.id);
      expect(revisions).toEqual([]);
    });
  });

  describe('calculateDiff', () => {
    it('should detect changed fields', () => {
      const oldData = {
        status: 'Bekliyor',
        price: null,
        currency: null,
      };

      const newData = {
        status: 'Kazanildi',
        price: 5000,
        currency: 'USD',
      };

      const changes = quotationRevisions.calculateDiff(oldData, newData);

      expect(changes).toHaveLength(3);
      expect(changes).toContainEqual({ field: 'status', old_value: 'Bekliyor', new_value: 'Kazanildi' });
      expect(changes).toContainEqual({ field: 'price', old_value: null, new_value: 5000 });
      expect(changes).toContainEqual({ field: 'currency', old_value: null, new_value: 'USD' });
    });

    it('should not include unchanged fields', () => {
      const oldData = {
        status: 'Bekliyor',
        price: 5000,
      };

      const newData = {
        status: 'Bekliyor',
        price: 5000,
      };

      const changes = quotationRevisions.calculateDiff(oldData, newData);
      expect(changes).toHaveLength(0);
    });

    it('should handle complex values', () => {
      const oldData = {
        tags: ['a', 'b'],
        metadata: { key: 'value' },
      };

      const newData = {
        tags: ['a', 'b', 'c'],
        metadata: { key: 'new_value' },
      };

      const changes = quotationRevisions.calculateDiff(oldData, newData);

      expect(changes).toHaveLength(2);
      expect(changes).toContainEqual({ field: 'tags', old_value: ['a', 'b'], new_value: ['a', 'b', 'c'] });
      expect(changes).toContainEqual({ field: 'metadata', old_value: { key: 'value' }, new_value: { key: 'new_value' } });
    });

    it('should handle undefined values as null', () => {
      const oldData = {
        price: undefined,
      };

      const newData = {
        price: 5000,
      };

      const changes = quotationRevisions.calculateDiff(oldData, newData);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ field: 'price', old_value: null, new_value: 5000 });
    });
  });

  describe('deleteRevisionsByQuotationId', () => {
    it('should delete all revisions for a quotation', () => {
      const quotation = quotations.createQuotation({
        customer_id: TEST_CUSTOMER_ID,
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkiye',
        destination_country: 'Almanya',
        incoterm: 'FOB',
        assigned_user_id: TEST_USER_ID,
      }, TEST_USER_ID);

      const changes1 = [{ field: 'status', old_value: 'Bekliyor', new_value: 'Kazanildi' }];
      const changes2 = [{ field: 'price', old_value: null, new_value: 5000 }];

      quotationRevisions.createRevision(quotation.id, changes1, TEST_USER_ID);
      quotationRevisions.createRevision(quotation.id, changes2, TEST_USER_ID);

      const deletedCount = quotationRevisions.deleteRevisionsByQuotationId(quotation.id);

      expect(deletedCount).toBe(2);

      const remaining = quotationRevisions.getRevisionsByQuotationId(quotation.id);
      expect(remaining).toHaveLength(0);
    });
  });
});
