import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CreateQuotationInput } from '@/types';

// Mock better-sqlite3
const mockDb = {
  prepare: vi.fn(),
  exec: vi.fn(),
};

const mockStmt = {
  run: vi.fn(),
  get: vi.fn(),
  all: vi.fn(),
};

vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => mockDb),
}));

describe('Quotations DB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue(mockStmt);
  });

  describe('generateQuoteNo', () => {
    it('should generate first quote number for a new year', async () => {
      const year = new Date().getFullYear();
      mockStmt.get.mockReturnValue(null);
      
      // Re-import to get fresh module with mocked db
      const { createQuotation } = await import('../quotations');
      
      const input: CreateQuotationInput = {
        customer_id: 'cust-1',
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkey',
        destination_country: 'Germany',
        incoterm: 'FOB',
        price: 1000,
        currency: 'USD',
        assigned_user_id: 'user-1',
      };
      
      mockStmt.run.mockReturnValue({ changes: 1 });
      const result = createQuotation(input, 'user-1');
      
      expect(result.quote_no).toMatch(new RegExp(`TKF-${year}-0001`));
    });

    it('should generate sequential quote number', async () => {
      const year = new Date().getFullYear();
      mockStmt.get.mockReturnValue({ quote_no: `TKF-${year}-0005` });
      
      const { createQuotation } = await import('../quotations');
      
      const input: CreateQuotationInput = {
        customer_id: 'cust-1',
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkey',
        destination_country: 'Germany',
        incoterm: 'FOB',
        price: 1000,
        currency: 'USD',
        assigned_user_id: 'user-1',
      };
      
      mockStmt.run.mockReturnValue({ changes: 1 });
      const result = createQuotation(input, 'user-1');
      
      expect(result.quote_no).toBe(`TKF-${year}-0006`);
    });
  });

  describe('createQuotation', () => {
    it('should create a quotation with all required fields', async () => {
      mockStmt.get.mockReturnValue(null);
      mockStmt.run.mockReturnValue({ changes: 1 });
      
      const { createQuotation } = await import('../quotations');
      
      const input: CreateQuotationInput = {
        customer_id: 'cust-1',
        quote_date: '2026-03-06',
        valid_until: '2026-03-20',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkey',
        destination_country: 'Germany',
        pol: 'Istanbul',
        pod: 'Hamburg',
        incoterm: 'FOB',
        price: 1500,
        currency: 'USD',
        price_note: 'Test note',
        status: 'Bekliyor',
        assigned_user_id: 'user-1',
      };
      
      const result = createQuotation(input, 'user-1');
      
      expect(result).toMatchObject({
        customer_id: 'cust-1',
        quote_date: '2026-03-06',
        valid_until: '2026-03-20',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkey',
        destination_country: 'Germany',
        pol: 'Istanbul',
        pod: 'Hamburg',
        incoterm: 'FOB',
        price: 1500,
        currency: 'USD',
        price_note: 'Test note',
        status: 'Bekliyor',
        assigned_user_id: 'user-1',
        created_by: 'user-1',
        revision_count: 0,
        deleted_at: null,
      });
      
      expect(result.id).toBeDefined();
      expect(result.quote_no).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });

    it('should set default values for optional fields', async () => {
      mockStmt.get.mockReturnValue(null);
      mockStmt.run.mockReturnValue({ changes: 1 });
      
      const { createQuotation } = await import('../quotations');
      
      const input: CreateQuotationInput = {
        customer_id: 'cust-1',
        quote_date: '2026-03-06',
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkey',
        destination_country: 'Germany',
        incoterm: 'FOB',
        price: 1000,
        currency: 'USD',
        assigned_user_id: 'user-1',
      };
      
      const result = createQuotation(input, 'user-1');
      
      expect(result.valid_until).toBeNull();
      expect(result.pol).toBeNull();
      expect(result.pod).toBeNull();
      expect(result.price_note).toBeNull();
      expect(result.status).toBe('Bekliyor');
      expect(result.loss_reason).toBeNull();
    });
  });

  describe('mapRowToQuotation', () => {
    it('should correctly map database row to Quotation object', async () => {
      mockStmt.get.mockReturnValue({
        id: 'quote-1',
        quote_no: 'TKF-2026-0001',
        customer_id: 'cust-1',
        quote_date: '2026-03-06',
        valid_until: null,
        transport_mode: 'Deniz',
        service_type: 'FCL',
        origin_country: 'Turkey',
        destination_country: 'Germany',
        pol: null,
        pod: null,
        incoterm: 'FOB',
        price: 1000,
        currency: 'USD',
        price_note: null,
        status: 'Bekliyor',
        loss_reason: null,
        assigned_user_id: 'user-1',
        revision_count: 0,
        created_by: 'user-1',
        created_at: '2026-03-06T00:00:00Z',
        updated_at: '2026-03-06T00:00:00Z',
        deleted_at: null,
      });
      
      const { getQuotationById } = await import('../quotations');
      const result = getQuotationById('quote-1');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('quote-1');
      expect(result?.quote_no).toBe('TKF-2026-0001');
      expect(result?.price).toBe(1000);
    });
  });

  describe('updateQuotation', () => {
    it('should update specified fields', async () => {
      mockStmt.get
        .mockReturnValueOnce({
          id: 'quote-1',
          quote_no: 'TKF-2026-0001',
          customer_id: 'cust-1',
          quote_date: '2026-03-06',
          valid_until: null,
          transport_mode: 'Deniz',
          service_type: 'FCL',
          origin_country: 'Turkey',
          destination_country: 'Germany',
          pol: null,
          pod: null,
          incoterm: 'FOB',
          price: 1000,
          currency: 'USD',
          price_note: null,
          status: 'Bekliyor',
          loss_reason: null,
          assigned_user_id: 'user-1',
          revision_count: 0,
          created_by: 'user-1',
          created_at: '2026-03-06T00:00:00Z',
          updated_at: '2026-03-06T00:00:00Z',
          deleted_at: null,
        })
        .mockReturnValueOnce({
          id: 'quote-1',
          quote_no: 'TKF-2026-0001',
          customer_id: 'cust-1',
          quote_date: '2026-03-06',
          valid_until: null,
          transport_mode: 'Hava',
          service_type: 'FCL',
          origin_country: 'Turkey',
          destination_country: 'Germany',
          pol: null,
          pod: null,
          incoterm: 'FOB',
          price: 1500,
          currency: 'EUR',
          price_note: null,
          status: 'Kazanildi',
          loss_reason: null,
          assigned_user_id: 'user-1',
          revision_count: 1,
          created_by: 'user-1',
          created_at: '2026-03-06T00:00:00Z',
          updated_at: '2026-03-06T01:00:00Z',
          deleted_at: null,
        });
      
      mockStmt.run.mockReturnValue({ changes: 1 });
      
      const { updateQuotation } = await import('../quotations');
      
      const result = updateQuotation('quote-1', {
        transport_mode: 'Hava',
        price: 1500,
        currency: 'EUR',
        status: 'Kazanildi',
      }, true);
      
      expect(result).not.toBeNull();
      expect(result?.transport_mode).toBe('Hava');
      expect(result?.price).toBe(1500);
      expect(result?.currency).toBe('EUR');
      expect(result?.status).toBe('Kazanildi');
    });

    it('should return null for non-existent quotation', async () => {
      mockStmt.get.mockReturnValue(undefined);
      
      const { updateQuotation } = await import('../quotations');
      
      const result = updateQuotation('non-existent', { price: 2000 });
      
      expect(result).toBeNull();
    });
  });

  describe('softDeleteQuotation', () => {
    it('should soft delete a quotation', async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });
      
      const { softDeleteQuotation } = await import('../quotations');
      
      const result = softDeleteQuotation('quote-1');
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent quotation', async () => {
      mockStmt.run.mockReturnValue({ changes: 0 });
      
      const { softDeleteQuotation } = await import('../quotations');
      
      const result = softDeleteQuotation('non-existent');
      
      expect(result).toBe(false);
    });
  });
});