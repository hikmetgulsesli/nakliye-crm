import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { GET as getById, PUT, DELETE } from '../[id]/route';

// Mock the database and auth modules
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/quotations', () => ({
  getAllQuotations: vi.fn(),
  getQuotationsByCustomerId: vi.fn(),
  createQuotation: vi.fn(),
  getQuotationById: vi.fn(),
  getQuotationByIdWithRelations: vi.fn(),
  updateQuotation: vi.fn(),
  deleteQuotation: vi.fn(),
}));

vi.mock('@/lib/db/quotation-revisions', () => ({
  createRevision: vi.fn(),
  getRevisionsByQuotationId: vi.fn(),
}));

import { getSession } from '@/lib/auth/session';
import { getAllQuotations, createQuotation, getQuotationByIdWithRelations, deleteQuotation } from '@/lib/db/quotations';

describe('Quotations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/quotations', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const response = await GET(new Request('http://localhost/api/quotations'));
      expect(response.status).toBe(401);
    });

    it('returns all quotations when authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1', role: 'user' } });
      vi.mocked(getAllQuotations).mockReturnValue([]);

      const response = await GET(new Request('http://localhost/api/quotations'));
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/quotations', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const response = await POST(new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({}),
      }));
      expect(response.status).toBe(401);
    });

    it('returns 400 when required fields are missing', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1', role: 'user' } });

      const response = await POST(new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({ customer_id: 'c1' }),
      }));
      expect(response.status).toBe(400);
    });

    it('requires loss_reason when status is Kaybedildi', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1', role: 'user' } });

      const response = await POST(new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: 'c1',
          quote_date: '2026-03-01',
          validity_date: '2026-03-15',
          transport_mode: 'Deniz',
          service_type: 'FCL',
          origin_country: 'Turkiye',
          destination_country: 'Almanya',
          incoterm: 'FOB',
          status: 'Kaybedildi',
          assigned_user_id: 'u1',
        }),
      }));
      expect(response.status).toBe(400);
    });

    it('creates quotation successfully', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1', role: 'user' } });
      vi.mocked(createQuotation).mockReturnValue({ id: 'q1', quote_no: 'TKF-2026-0001' });

      const response = await POST(new Request('http://localhost/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: 'c1',
          quote_date: '2026-03-01',
          validity_date: '2026-03-15',
          transport_mode: 'Deniz',
          service_type: 'FCL',
          origin_country: 'Turkiye',
          destination_country: 'Almanya',
          incoterm: 'FOB',
          status: 'Bekliyor',
          assigned_user_id: 'u1',
        }),
      }));
      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/quotations/[id]', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const response = await getById(new Request('http://localhost/api/quotations/q1'), { params: Promise.resolve({ id: 'q1' }) });
      expect(response.status).toBe(401);
    });

    it('returns 404 when quotation not found', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1', role: 'user' } });
      vi.mocked(getQuotationByIdWithRelations).mockReturnValue(null);

      const response = await getById(new Request('http://localhost/api/quotations/q1'), { params: Promise.resolve({ id: 'q1' }) });
      expect(response.status).toBe(404);
    });

    it('returns quotation when found', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1', role: 'user' } });
      vi.mocked(getQuotationByIdWithRelations).mockReturnValue({ id: 'q1', quote_no: 'TKF-2026-0001' });

      const response = await getById(new Request('http://localhost/api/quotations/q1'), { params: Promise.resolve({ id: 'q1' }) });
      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/quotations/[id]', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const response = await PUT(new Request('http://localhost/api/quotations/q1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'Kazanildi' }),
      }), { params: Promise.resolve({ id: 'q1' }) });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/quotations/[id]', () => {
    it('returns 403 when user is not admin', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1', role: 'user' } });

      const response = await DELETE(new Request('http://localhost/api/quotations/q1'), { params: Promise.resolve({ id: 'q1' }) });
      expect(response.status).toBe(403);
    });

    it('deletes quotation when admin', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
      vi.mocked(getQuotationById).mockReturnValue({ id: 'q1' });
      vi.mocked(deleteQuotation).mockReturnValue(true);

      const response = await DELETE(new Request('http://localhost/api/quotations/q1'), { params: Promise.resolve({ id: 'q1' }) });
      expect(response.status).toBe(200);
    });
  });
});
