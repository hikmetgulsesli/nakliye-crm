import { GET as getCustomers, POST as createCustomer } from '@/app/api/customers/route.js';
import { GET as getCustomer, PATCH as updateCustomer, DELETE as deleteCustomer } from '@/app/api/customers/[id]/route.js';
import { GET as checkConflicts, POST as forceCreate } from '@/app/api/conflicts/route.js';
import { NextRequest } from 'next/server';

// Mock the database and services
jest.mock('@/db/connection.js', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/audit.js', () => ({
  logAudit: jest.fn(),
  getAuditLogs: jest.fn(),
}));

import pool from '@/db/connection.js';
import { logAudit } from '@/lib/audit.js';

const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>;
const mockLogAudit = logAudit as jest.MockedFunction<typeof logAudit>;

describe('Customer API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/customers', () => {
    it('returns paginated customers with filters', async () => {
      const mockCustomers = [
        {
          id: 1,
          company_name: 'Test Company',
          contact_name: 'John Doe',
          phone: '+1234567890',
          email: 'test@example.com',
          status: 'Aktif',
          potential: 'Yuksek',
          assigned_user_name: 'Admin User',
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }], command: 'SELECT', oid: 0, fields: [], } as never)
        .mockResolvedValueOnce({ rows: mockCustomers, command: 'SELECT', oid: 0, fields: [], } as never);

      const request = new NextRequest('http://localhost:3000/api/customers?page=1&limit=20');
      const response = await getCustomers(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockCustomers);
      expect(data.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('filters by search term', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }], command: 'SELECT', oid: 0, fields: [], } as never)
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', oid: 0, fields: [], } as never);

      const request = new NextRequest('http://localhost:3000/api/customers?search=Test');
      const response = await getCustomers(request);

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('company_name ILIKE'),
        expect.arrayContaining(['%Test%'])
      );
    });

    it('filters by status', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }], command: 'SELECT', oid: 0, fields: [], } as never)
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', oid: 0, fields: [], } as never);

      const request = new NextRequest('http://localhost:3000/api/customers?status=Aktif');
      const response = await getCustomers(request);

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status ='),
        expect.arrayContaining(['Aktif'])
      );
    });

    it('returns validation error for invalid parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/customers?page=invalid');
      const response = await getCustomers(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/customers', () => {
    it('creates a new customer with valid data', async () => {
      const customerData = {
        company_name: 'New Company',
        contact_name: 'Jane Doe',
        phone: '+9876543210',
        email: 'jane@example.com',
        status: 'Aktif',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          ...customerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as never);

      mockLogAudit.mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });

      const response = await createCustomer(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.company_name).toBe('New Company');
      expect(mockLogAudit).toHaveBeenCalled();
    });

    it('returns validation error for invalid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify({ company_name: '' }),
      });

      const response = await createCustomer(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns validation error for invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          company_name: 'Test',
          email: 'invalid-email',
        }),
      });

      const response = await createCustomer(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/customers/[id]', () => {
    it('returns a single customer', async () => {
      const mockCustomer = {
        id: 1,
        company_name: 'Test Company',
        contact_name: 'John Doe',
        status: 'Aktif',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockCustomer],
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as never);

      const request = new NextRequest('http://localhost:3000/api/customers/1');
      const response = await getCustomer(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.id).toBe(1);
    });

    it('returns 404 for non-existent customer', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], command: 'SELECT', oid: 0, fields: [], } as never);

      const request = new NextRequest('http://localhost:3000/api/customers/999');
      const response = await getCustomer(request, { params: Promise.resolve({ id: '999' }) });

      expect(response.status).toBe(404);
    });

    it('returns 400 for invalid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/customers/invalid');
      const response = await getCustomer(request, { params: Promise.resolve({ id: 'invalid' }) });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/customers/[id]', () => {
    it('updates a customer', async () => {
      const existingCustomer = {
        id: 1,
        company_name: 'Old Name',
        contact_name: 'John Doe',
        status: 'Aktif',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [existingCustomer], command: 'SELECT', oid: 0, fields: [], } as never)
        .mockResolvedValueOnce({
          rows: [{ ...existingCustomer, company_name: 'New Name' }],
          command: 'UPDATE',
          oid: 0,
          fields: [],
        } as never);

      mockLogAudit.mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/customers/1', {
        method: 'PATCH',
        body: JSON.stringify({ company_name: 'New Name' }),
      });

      const response = await updateCustomer(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.company_name).toBe('New Name');
    });

    it('returns validation error for invalid update data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, company_name: 'Test' }],
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as never);

      const request = new NextRequest('http://localhost:3000/api/customers/1', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'invalid' }),
      });

      const response = await updateCustomer(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/customers/[id]', () => {
    it('soft deletes a customer', async () => {
      const existingCustomer = {
        id: 1,
        company_name: 'Test Company',
        deleted_at: null,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [existingCustomer], command: 'SELECT', oid: 0, fields: [], } as never)
        .mockResolvedValueOnce({
          rows: [{ ...existingCustomer, deleted_at: new Date().toISOString() }],
          command: 'UPDATE',
          oid: 0,
          fields: [],
        } as never);

      mockLogAudit.mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/customers/1', {
        method: 'DELETE',
      });

      const response = await deleteCustomer(request, { params: Promise.resolve({ id: '1' }) });

      expect(response.status).toBe(200);
    });
  });
});

describe('Conflict Detection API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/conflicts/check', () => {
    it('detects conflicts by company name using fuzzy matching', async () => {
      const mockConflicts = [{
        id: 1,
        company_name: 'Test Company Ltd',
        contact_name: 'John Doe',
        phone: '+1234567890',
        email: 'test@example.com',
        sim_score: '0.85',
      }];

      mockQuery.mockResolvedValueOnce({
        rows: mockConflicts,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as never);

      const request = new NextRequest('http://localhost:3000/api/conflicts/check?company_name=Test Company');
      const response = await checkConflicts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.hasConflicts).toBe(true);
      expect(data.data.conflicts.length).toBeGreaterThan(0);
      expect(data.data.conflicts[0].matchedFields).toContain('company_name');
    });

    it('detects conflicts by exact phone match', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], command: 'SELECT', oid: 0, fields: [], } as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          company_name: 'Test Company',
          phone: '+1234567890',
        }],
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as never);

      const request = new NextRequest('http://localhost:3000/api/conflicts/check?phone=%2B1234567890');
      const response = await checkConflicts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('phone ='),
        expect.arrayContaining(['+1234567890'])
      );
    });

    it('detects conflicts by exact email match', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], command: 'SELECT', oid: 0, fields: [], } as never);
      mockQuery.mockResolvedValueOnce({ rows: [], command: 'SELECT', oid: 0, fields: [], } as never);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          company_name: 'Test Company',
          email: 'test@example.com',
        }],
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as never);

      const request = new NextRequest('http://localhost:3000/api/conflicts/check?email=test@example.com');
      const response = await checkConflicts(request);

      expect(response.status).toBe(200);
    });

    it('excludes specified customer ID from conflict check', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], command: 'SELECT', oid: 0, fields: [], } as never);

      const request = new NextRequest('http://localhost:3000/api/conflicts/check?company_name=Test&exclude_id=1');
      await checkConflicts(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('c.id !='),
        expect.arrayContaining(['Test', 1])
      );
    });

    it('returns no conflicts when none found', async () => {
      mockQuery.mockResolvedValue({ rows: [], command: 'SELECT', oid: 0, fields: [], } as never);

      const request = new NextRequest('http://localhost:3000/api/conflicts/check?company_name=UniqueName');;
      const response = await checkConflicts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.hasConflicts).toBe(false);
      expect(data.data.conflicts).toEqual([]);
    });

    it('returns validation error for invalid parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/conflicts/check?email=invalid-email');
      const response = await checkConflicts(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/conflicts/force-create', () => {
    it('creates customer when force flag is true', async () => {
      const customerData = {
        company_name: 'Duplicate Company',
        contact_name: 'Jane Doe',
        phone: '+1234567890',
        force: true,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          company_name: 'Duplicate Company',
          contact_name: 'Jane Doe',
          phone: '+1234567890',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as never);

      mockLogAudit.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/conflicts/force-create', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });

      const response = await forceCreate(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.company_name).toBe('Duplicate Company');
      expect(mockLogAudit).toHaveBeenCalledWith(
        null,
        'customer',
        1,
        'FORCE_CREATE',
        expect.anything(),
        true
      );
    });

    it('returns error when force flag is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/conflicts/force-create', {
        method: 'POST',
        body: JSON.stringify({ company_name: 'Test' }),
      });

      const response = await forceCreate(request);

      expect(response.status).toBe(400);
    });
  });
});
