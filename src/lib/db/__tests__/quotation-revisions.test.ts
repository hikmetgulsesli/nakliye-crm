import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RevisionChange } from '@/types';

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

describe('Quotation Revisions DB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue(mockStmt);
  });

  describe('createRevision', () => {
    it('should create a revision record', async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });
      
      const { createRevision } = await import('../quotation-revisions');
      
      const changes: RevisionChange[] = [
        { field: 'price', old_value: 1000, new_value: 1500 },
        { field: 'status', old_value: 'Bekliyor', new_value: 'Kazanildi' },
      ];
      
      const result = createRevision('quote-1', 1, changes, 'user-1');
      
      expect(result).toMatchObject({
        quotation_id: 'quote-1',
        revision_no: 1,
        changed_fields: changes,
        revised_by: 'user-1',
      });
      expect(result.id).toBeDefined();
      expect(result.revised_at).toBeDefined();
    });

    it('should store changes as JSON string', async () => {
      mockStmt.run.mockReturnValue({ changes: 1 });
      
      const { createRevision } = await import('../quotation-revisions');
      
      const changes: RevisionChange[] = [
        { field: 'price', old_value: 1000, new_value: 1500 },
      ];
      
      createRevision('quote-1', 1, changes, 'user-1');
      
      const runCall = mockStmt.run.mock.calls[0];
      const storedChanges = JSON.parse(runCall[3]);
      expect(storedChanges).toEqual(changes);
    });
  });

  describe('getRevisionsByQuotationId', () => {
    it('should return all revisions for a quotation', async () => {
      mockStmt.all.mockReturnValue([
        {
          id: 'rev-2',
          quotation_id: 'quote-1',
          revision_no: 2,
          changed_fields: JSON.stringify([{ field: 'price', old_value: 1200, new_value: 1300 }]),
          revised_by: 'user-1',
          revised_at: '2026-03-06T02:00:00Z',
          revised_by_name: 'John Doe',
        },
        {
          id: 'rev-1',
          quotation_id: 'quote-1',
          revision_no: 1,
          changed_fields: JSON.stringify([{ field: 'price', old_value: 1000, new_value: 1200 }]),
          revised_by: 'user-1',
          revised_at: '2026-03-06T01:00:00Z',
          revised_by_name: 'John Doe',
        },
      ]);
      
      const { getRevisionsByQuotationId } = await import('../quotation-revisions');
      
      const result = getRevisionsByQuotationId('quote-1');
      
      expect(result).toHaveLength(2);
      expect(result[0].revision_no).toBe(2);
      expect(result[1].revision_no).toBe(1);
      expect(result[0].revised_by_user.full_name).toBe('John Doe');
    });

    it('should return empty array when no revisions exist', async () => {
      mockStmt.all.mockReturnValue([]);
      
      const { getRevisionsByQuotationId } = await import('../quotation-revisions');
      
      const result = getRevisionsByQuotationId('quote-1');
      
      expect(result).toEqual([]);
    });
  });

  describe('getNextRevisionNumber', () => {
    it('should return 1 for first revision', async () => {
      mockStmt.get.mockReturnValue({ max_revision: null });
      
      const { getNextRevisionNumber } = await import('../quotation-revisions');
      
      const result = getNextRevisionNumber('quote-1');
      
      expect(result).toBe(1);
    });

    it('should return next sequential number', async () => {
      mockStmt.get.mockReturnValue({ max_revision: 5 });
      
      const { getNextRevisionNumber } = await import('../quotation-revisions');
      
      const result = getNextRevisionNumber('quote-1');
      
      expect(result).toBe(6);
    });
  });

  describe('computeChanges', () => {
    it('should detect changes between old and new data', async () => {
      const { computeChanges } = await import('../quotation-revisions');
      
      const oldData = {
        price: 1000,
        status: 'Bekliyor',
        transport_mode: 'Deniz',
      };
      
      const newData = {
        price: 1500,
        status: 'Kazanildi',
        transport_mode: 'Deniz',
      };
      
      const changes = computeChanges(oldData, newData);
      
      expect(changes).toHaveLength(2);
      expect(changes).toContainEqual({ field: 'price', old_value: 1000, new_value: 1500 });
      expect(changes).toContainEqual({ field: 'status', old_value: 'Bekliyor', new_value: 'Kazanildi' });
    });

    it('should not include unchanged fields', async () => {
      const { computeChanges } = await import('../quotation-revisions');
      
      const oldData = {
        price: 1000,
        transport_mode: 'Deniz',
      };
      
      const newData = {
        price: 1000,
        transport_mode: 'Deniz',
      };
      
      const changes = computeChanges(oldData, newData);
      
      expect(changes).toHaveLength(0);
    });

    it('should handle null/undefined values correctly', async () => {
      const { computeChanges } = await import('../quotation-revisions');
      
      const oldData = {
        price: 1000,
        loss_reason: null,
      };
      
      const newData = {
        price: 1000,
        loss_reason: 'Fiyat',
      };
      
      const changes = computeChanges(oldData, newData);
      
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({ 
        field: 'loss_reason', 
        old_value: null, 
        new_value: 'Fiyat' 
      });
    });

    it('should track all defined fields', async () => {
      const { computeChanges } = await import('../quotation-revisions');
      
      const oldData = {
        customer_id: 'cust-1',
        quote_date: '2026-03-01',
        valid_until: '2026-03-15',
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
      };
      
      const newData = {
        ...oldData,
        price: 1200,
        valid_until: '2026-03-20',
      };
      
      const changes = computeChanges(oldData, newData);
      
      expect(changes).toHaveLength(2);
      expect(changes.map(c => c.field)).toContain('price');
      expect(changes.map(c => c.field)).toContain('valid_until');
    });
  });
});