import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock session
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

// Mock database modules
vi.mock('@/lib/db/quotations', () => ({
  createQuotation: vi.fn(),
  getAllQuotations: vi.fn(),
  getQuotationById: vi.fn(),
  getQuotationByIdWithDetails: vi.fn(),
  updateQuotation: vi.fn(),
  softDeleteQuotation: vi.fn(),
  updateCustomerLastQuoteDate: vi.fn(),
}));

vi.mock('@/lib/db/quotation-revisions', () => ({
  createRevision: vi.fn(),
  computeChanges: vi.fn(),
  getNextRevisionNumber: vi.fn(),
}));

vi.mock('@/lib/db/users', () => ({
  getAllUsers: vi.fn(),
}));

vi.mock('@/lib/db/customers', () => ({
  getAllCustomers: vi.fn(),
}));

import { GET, POST } from '../route';
import { getSession } from '@/lib/auth/session';
import { createQuotation, getAllQuotations, updateCustomerLastQuoteDate } from '@/lib/db/quotations';
import { getAllCustomers } from '@/lib/db/customers';
import { getAllUsers } from '@/lib/db/users';

describe('Quotations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/quotations', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      
      const request = new Request('http://localhost/api/quotations');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return all quotations with filters', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
        expires: '2026-03-06T00:00:00Z',
      });
      
      const mockQuotations = [
        {
          id: 'quote-1',
          quote_no: 'TKF-2026-0001',
          customer: { id: 'cust-1', company_name: 'Test Co', contact_name: 'John' },
          status: 'Bekliyor',
        },
      ];
      
      vi.mocked(getAllQuotations).mockReturnValue(mockQuotations);
      
      const request = new Request('http://localhost/api/quotations?status=Bekliyor&customer_id=cust-1');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.quotations).toHaveLength(1);
      expect(getAllQuotations).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'Bekliyor',
          customer_id: 'cust-1',
        })
      );
    });

    it('should support search filter', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
        expires: '2026-03-06T00:00:00Z',
      });
      
      vi.mocked(getAllQuotations).mockReturnValue([]);
      
      const request = new Request('http://localhost/api/quotations?search=TKF-2026');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(getAllQuotations).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'TKF-2026',
        })
      );
    });
  });

  describe('POST /api/quotations', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      
      const request = new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
        expires: '2026-03-06T00:00:00Z',
      });
      
      const request = new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.errors).toContain('Müşteri seçimi zorunludur');
      expect(data.errors).toContain('Teklif tarihi zorunludur');
    });

    it('should validate loss_reason when status is Kaybedildi', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
        expires: '2026-03-06T00:00:00Z',
      });
      
      vi.mocked(getAllCustomers).mockReturnValue([{ id: 'cust-1' }] as unknown as Awaited<ReturnType<typeof getAllCustomers>>);
      vi.mocked(getAllUsers).mockReturnValue([{ id: 'user-1' }] as unknown as Awaited<ReturnType<typeof getAllUsers>>);
      
      const request = new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
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
          status: 'Kaybedildi',
        }),
      });
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.errors).toContain('Kaybedilme nedeni seçilmelidir');
    });

    it('should create quotation with valid data', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
        expires: '2026-03-06T00:00:00Z',
      });
      
      vi.mocked(getAllCustomers).mockReturnValue([{ id: 'cust-1' }] as unknown as Awaited<ReturnType<typeof getAllCustomers>>);
      vi.mocked(getAllUsers).mockReturnValue([{ id: 'user-1' }] as unknown as Awaited<ReturnType<typeof getAllUsers>>);
      
      const mockQuotation = {
        id: 'quote-1',
        quote_no: 'TKF-2026-0001',
        customer_id: 'cust-1',
        status: 'Bekliyor',
      };
      
      vi.mocked(createQuotation).mockReturnValue(mockQuotation as unknown as ReturnType<typeof createQuotation>);
      vi.mocked(updateCustomerLastQuoteDate).mockImplementation(() => {});
      
      const request = new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
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
        }),
      });
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.quotation).toBeDefined();
      expect(updateCustomerLastQuoteDate).toHaveBeenCalledWith('cust-1');
    });

    it('should validate customer exists', async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
        expires: '2026-03-06T00:00:00Z',
      });
      
      vi.mocked(getAllCustomers).mockReturnValue([]);
      
      const request = new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: 'non-existent',
          quote_date: '2026-03-06',
          transport_mode: 'Deniz',
          service_type: 'FCL',
          origin_country: 'Turkey',
          destination_country: 'Germany',
          incoterm: 'FOB',
          price: 1000,
          currency: 'USD',
          assigned_user_id: 'user-1',
        }),
      });
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid customer');
    });
  });
});