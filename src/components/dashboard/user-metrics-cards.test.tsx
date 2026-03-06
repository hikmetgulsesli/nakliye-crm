import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UserMetricsCards } from './user-metrics-cards';

// Mock fetch
global.fetch = vi.fn();

describe('UserMetricsCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<UserMetricsCards autoRefresh={false} />);
    
    // Should show 4 skeleton loaders for primary metrics
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(4);
  });

  it('renders metrics after successful fetch', async () => {
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

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { metrics: mockMetrics } }),
    });

    render(<UserMetricsCards autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    expect(screen.getByText('Bu Hafta Teklif')).toBeInTheDocument();
    expect(screen.getByText('Bu Ay Teklif')).toBeInTheDocument();
    expect(screen.getByText('Kazanma Oranı')).toBeInTheDocument();
    expect(screen.getByText('Görüşülen Müşteri')).toBeInTheDocument();
  });

  it('renders error state on fetch failure', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<UserMetricsCards autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/hata oluştu/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/tekrar dene/i)).toBeInTheDocument();
  });

  it('displays secondary metrics correctly', async () => {
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

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { metrics: mockMetrics } }),
    });

    render(<UserMetricsCards autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText('Bekleyen Teklif')).toBeInTheDocument();
    });

    expect(screen.getByText('Aktif Müşteri')).toBeInTheDocument();
    expect(screen.getByText('Bu Hafta Aktivite')).toBeInTheDocument();
  });
});