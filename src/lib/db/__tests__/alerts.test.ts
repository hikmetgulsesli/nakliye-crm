import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Alert } from '@/types/index.js';

// Mock better-sqlite3
const mockDb = {
  exec: vi.fn(),
  prepare: vi.fn(),
};

const mockRun = vi.fn();
const mockGet = vi.fn();
const mockAll = vi.fn();

vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => mockDb),
}));

// Import after mocking
import {
  createAlert,
  getAlertById,
  getAlerts,
  getAlertCounts,
  markAlertAsReviewed,
  dismissAlert,
  deleteAlertsByEntity,
  deleteOldAlerts,
} from '@/lib/db/alerts.js';

describe('Alert Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue({
      run: mockRun,
      get: mockGet,
      all: mockAll,
    });
  });

  const mockAlert: Alert = {
    id: 'alert-1',
    type: 'no_contact_14d',
    title: 'Test Alert',
    description: 'Test Description',
    entity_type: 'customer',
    entity_id: 'customer-1',
    entity_name: 'Test Company',
    severity: 'medium',
    status: 'active',
    assigned_user_id: 'user-1',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    reviewed_at: null,
    reviewed_by: null,
  };

  describe('createAlert', () => {
    it('creates a new alert', () => {
      mockRun.mockReturnValue({ changes: 1 });

      const result = createAlert(
        'no_contact_14d',
        'Test Alert',
        'Test Description',
        'customer',
        'customer-1',
        'Test Company',
        'medium',
        'user-1'
      );

      expect(result).toMatchObject({
        type: 'no_contact_14d',
        title: 'Test Alert',
        description: 'Test Description',
        entity_type: 'customer',
        entity_id: 'customer-1',
        entity_name: 'Test Company',
        severity: 'medium',
        status: 'active',
        assigned_user_id: 'user-1',
      });
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
    });
  });

  describe('getAlertById', () => {
    it('returns alert when found', () => {
      mockGet.mockReturnValue(mockAlert);

      const result = getAlertById('alert-1');

      expect(result).toEqual(mockAlert);
    });

    it('returns null when not found', () => {
      mockGet.mockReturnValue(undefined);

      const result = getAlertById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAlerts', () => {
    it('returns all alerts without filter', () => {
      mockAll.mockReturnValue([mockAlert]);

      const result = getAlerts();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'alert-1',
        title: 'Test Alert',
      });
    });

    it('filters by type', () => {
      mockAll.mockReturnValue([mockAlert]);

      getAlerts({ type: 'no_contact_14d' });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('a.type = ?')
      );
    });

    it('filters by status', () => {
      mockAll.mockReturnValue([mockAlert]);

      getAlerts({ status: 'active' });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('a.status = ?')
      );
    });

    it('filters by severity', () => {
      mockAll.mockReturnValue([mockAlert]);

      getAlerts({ severity: 'high' });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('a.severity = ?')
      );
    });

    it('filters by assigned user', () => {
      mockAll.mockReturnValue([mockAlert]);

      getAlerts({ assigned_user_id: 'user-1' });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('a.assigned_user_id = ?')
      );
    });
  });

  describe('getAlertCounts', () => {
    it('returns counts for all alert types', () => {
      mockGet.mockReturnValue({ count: 5 });

      const result = getAlertCounts();

      expect(result).toEqual({
        no_contact_14d: 5,
        pending_quote_7d: 5,
        expired_quote: 5,
        high_potential_no_quote_30d: 5,
        total: 20,
      });
    });
  });

  describe('markAlertAsReviewed', () => {
    it('updates alert status to reviewed', () => {
      mockRun.mockReturnValue({ changes: 1 });
      mockGet.mockReturnValue({ ...mockAlert, status: 'reviewed' });

      const result = markAlertAsReviewed('alert-1', 'user-1');

      expect(mockRun).toHaveBeenCalled();
      expect(result?.status).toBe('reviewed');
    });
  });

  describe('dismissAlert', () => {
    it('updates alert status to dismissed', () => {
      mockRun.mockReturnValue({ changes: 1 });
      mockGet.mockReturnValue({ ...mockAlert, status: 'dismissed' });

      const result = dismissAlert('alert-1');

      expect(mockRun).toHaveBeenCalled();
      expect(result?.status).toBe('dismissed');
    });
  });

  describe('deleteAlertsByEntity', () => {
    it('deletes alerts for entity', () => {
      mockRun.mockReturnValue({ changes: 2 });

      deleteAlertsByEntity('customer', 'customer-1');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM alerts')
      );
    });
  });

  describe('deleteOldAlerts', () => {
    it('deletes reviewed and dismissed alerts older than specified days', () => {
      mockRun.mockReturnValue({ changes: 5 });

      const result = deleteOldAlerts(30);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM alerts')
      );
      expect(result).toBe(5);
    });
  });
});
