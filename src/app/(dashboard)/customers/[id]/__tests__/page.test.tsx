import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CustomerDetailPage from '../page';
import type { CustomerWithUser, ActivityWithUser, AuditLogWithUser } from '@/types/index.js';

// Mock fetch globally
const mockFetch = vi.fn();
(global as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;

// Mock useParams to return a customer id
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: 'test-customer-123' }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    toString: () => '',
  }),
  usePathname: () => '/customers/test-customer-123',
}));

const mockCustomer: CustomerWithUser = {
  id: 'test-customer-123',
  company_name: 'Test Company Ltd.',
  contact_name: 'John Doe',
  phone: '+90 532 123 4567',
  email: 'john@testcompany.com',
  address: 'Istanbul, Turkey',
  transport_modes: ['Deniz', 'Hava'],
  service_types: ['FCL', 'LCL'],
  incoterms: ['FOB', 'CIF'],
  direction: ['Ithalat', 'Ihracat'],
  origin_countries: ['Turkey', 'China'],
  destination_countries: ['Germany', 'USA'],
  source: 'Referans',
  potential: 'Yuksek',
  status: 'Aktif',
  assigned_user_id: 'user-1',
  assigned_user: { id: 'user-1', full_name: 'Ali Veli' },
  last_contact_date: '2026-03-01T10:00:00Z',
  last_quote_date: '2026-02-15T14:30:00Z',
  notes: 'Important customer for international shipping',
  created_by: 'user-1',
  created_by_user: { id: 'user-1', full_name: 'Ali Veli' },
  created_at: '2026-01-15T09:00:00Z',
  updated_at: '2026-03-01T10:00:00Z',
};

const mockActivities: ActivityWithUser[] = [
  {
    id: 'activity-1',
    customer_id: 'test-customer-123',
    type: 'Telefon',
    date: '2026-03-01T10:00:00Z',
    duration: 30,
    notes: 'Discussed shipping options for Q2',
    outcome: 'Olumlu',
    next_action_date: '2026-03-08T10:00:00Z',
    created_by: 'user-1',
    created_by_user: { id: 'user-1', full_name: 'Ali Veli' },
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
];

const mockAuditLogs: AuditLogWithUser[] = [
  {
    id: 'audit-1',
    user_id: 'user-1',
    record_type: 'customer',
    record_id: 'test-customer-123',
    action: 'create',
    changes: null,
    created_at: '2026-01-15T09:00:00Z',
    user: { id: 'user-1', full_name: 'Ali Veli' },
  },
];

describe('CustomerDetailPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockReset();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<CustomerDetailPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders customer details after loading', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customer: mockCustomer }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: mockAuditLogs }),
      });

    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company Ltd.')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+90 532 123 4567')).toBeInTheDocument();
    expect(screen.getByText('john@testcompany.com')).toBeInTheDocument();
  });

  it('displays error message when customer not found', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });

    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/musteri bulunamadi/i)).toBeInTheDocument();
    });
  });

  it('has all four tabs', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customer: mockCustomer }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: mockAuditLogs }),
      });

    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company Ltd.')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /genel bakis/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aktiviteler/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /teklifler/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /geçmiş/i })).toBeInTheDocument();
  });

  it('displays quick stats cards', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customer: mockCustomer }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: mockAuditLogs }),
      });

    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company Ltd.')).toBeInTheDocument();
    });

    expect(screen.getByText('Son Görüşme')).toBeInTheDocument();
    expect(screen.getByText('Son Teklif')).toBeInTheDocument();
    expect(screen.getByText('Aktivite Sayısı')).toBeInTheDocument();
    expect(screen.getByText('Temsilci')).toBeInTheDocument();
  });

  it('displays transport preferences in overview', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customer: mockCustomer }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: mockAuditLogs }),
      });

    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company Ltd.')).toBeInTheDocument();
    });

    expect(screen.getByText('Nakliye Tercihleri')).toBeInTheDocument();
    expect(screen.getByText('Deniz')).toBeInTheDocument();
    expect(screen.getByText('Hava')).toBeInTheDocument();
  });

  it('displays responsive card layout', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customer: mockCustomer }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: mockAuditLogs }),
      });

    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company Ltd.')).toBeInTheDocument();
    });

    expect(screen.getByText('Temel Bilgiler')).toBeInTheDocument();
    expect(screen.getByText('CRM Bilgileri')).toBeInTheDocument();
    expect(screen.getByText('Kayıt Bilgileri')).toBeInTheDocument();
  });

  it('displays edit button', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ customer: mockCustomer }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: mockAuditLogs }),
      });

    render(<CustomerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company Ltd.')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /düzenle/i });
    expect(editButton).toBeInTheDocument();
  });
});
