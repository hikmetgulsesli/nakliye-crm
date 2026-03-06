import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RecentActivityFeed } from './recent-activity-feed';

// Mock fetch
global.fetch = vi.fn();

describe('RecentActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<RecentActivityFeed autoRefresh={false} />);
    
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders activities after successful fetch', async () => {
    const mockActivities = [
      {
        id: '1',
        customerId: '101',
        customerName: 'ABC Lojistik',
        type: 'phone',
        typeLabel: 'Telefon Görüşmesi',
        activityDate: new Date().toISOString(),
        outcome: 'positive',
        outcomeLabel: 'Olumlu',
        notes: 'Müşteri teklif istedi',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        customerId: '102',
        customerName: 'XYZ Nakliye',
        type: 'email',
        typeLabel: 'E-posta',
        activityDate: new Date().toISOString(),
        outcome: null,
        outcomeLabel: null,
        notes: 'Bilgilendirme maili gönderildi',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { recentActivities: mockActivities } }),
    });

    render(<RecentActivityFeed autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText('ABC Lojistik')).toBeInTheDocument();
    });

    expect(screen.getByText('XYZ Nakliye')).toBeInTheDocument();
    expect(screen.getByText('Telefon Görüşmesi')).toBeInTheDocument();
    expect(screen.getByText('E-posta')).toBeInTheDocument();
    expect(screen.getByText('Olumlu')).toBeInTheDocument();
  });

  it('renders empty state when no activities', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { recentActivities: [] } }),
    });

    render(<RecentActivityFeed autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Henüz aktivite kaydı bulunmuyor/i)).toBeInTheDocument();
    });
  });

  it('renders error state on fetch failure', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<RecentActivityFeed autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/hata oluştu/i)).toBeInTheDocument();
    });
  });
});