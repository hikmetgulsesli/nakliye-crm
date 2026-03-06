import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as sessionModule from '@/lib/auth/session';
import * as userDashboardModule from '@/lib/db/user-dashboard';

// Mock the modules
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db/user-dashboard', () => ({
  getUserDashboardMetrics: vi.fn(),
  getUpcomingFollowUps: vi.fn(),
  getRecentActivities: vi.fn(),
}));

describe('GET /api/dashboard/user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(sessionModule.getSession).mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/dashboard/user'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns user dashboard data when authenticated', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
      },
      expires: new Date().toISOString(),
    };

    const mockMetrics = {
      quotesThisWeek: 5,
      quotesThisMonth: 12,
      wonQuotesThisMonth: 3,
      winRateThisMonth: 25,
      customersContactedThisMonth: 8,
      pendingQuotes: 4,
      activeCustomersAssigned: 15,
      activitiesThisWeek: 6,
    };

    const mockFollowUps = [
      {
        id: '1',
        customerId: '101',
        customerName: 'ABC Lojistik',
        nextActionDate: '2026-03-10',
        notes: 'Fiyat teklifi bekleniyor',
        lastContactDate: '2026-03-06',
      },
    ];

    const mockActivities = [
      {
        id: '1',
        customerId: '101',
        customerName: 'ABC Lojistik',
        type: 'phone',
        typeLabel: 'Telefon Görüşmesi',
        activityDate: '2026-03-06',
        outcome: 'positive',
        outcomeLabel: 'Olumlu',
        notes: 'Müşteri teklif istedi',
        createdAt: '2026-03-06T10:00:00Z',
      },
    ];

    vi.mocked(sessionModule.getSession).mockResolvedValue(mockSession);
    vi.mocked(userDashboardModule.getUserDashboardMetrics).mockReturnValue(mockMetrics);
    vi.mocked(userDashboardModule.getUpcomingFollowUps).mockReturnValue(mockFollowUps);
    vi.mocked(userDashboardModule.getRecentActivities).mockReturnValue(mockActivities);

    const response = await GET(new Request('http://localhost/api/dashboard/user'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.metrics).toEqual(mockMetrics);
    expect(data.data.upcomingFollowUps).toEqual(mockFollowUps);
    expect(data.data.recentActivities).toEqual(mockActivities);
  });

  it('returns 500 on internal server error', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
      },
      expires: new Date().toISOString(),
    };

    vi.mocked(sessionModule.getSession).mockResolvedValue(mockSession);
    vi.mocked(userDashboardModule.getUserDashboardMetrics).mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await GET(new Request('http://localhost/api/dashboard/user'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});