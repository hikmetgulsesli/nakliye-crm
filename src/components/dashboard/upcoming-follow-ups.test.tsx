import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UpcomingFollowUps } from './upcoming-follow-ups';

// Mock fetch
global.fetch = vi.fn();

describe('UpcomingFollowUps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<UpcomingFollowUps autoRefresh={false} />);
    
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders follow-ups after successful fetch', async () => {
    const mockFollowUps = [
      {
        id: '1',
        customerId: '101',
        customerName: 'ABC Lojistik',
        nextActionDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        notes: 'Fiyat teklifi bekleniyor',
        lastContactDate: new Date().toISOString(),
      },
      {
        id: '2',
        customerId: '102',
        customerName: 'XYZ Nakliye',
        nextActionDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after
        notes: 'Görüşme planlanacak',
        lastContactDate: new Date().toISOString(),
      },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { upcomingFollowUps: mockFollowUps } }),
    });

    render(<UpcomingFollowUps autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText('ABC Lojistik')).toBeInTheDocument();
    });

    expect(screen.getByText('XYZ Nakliye')).toBeInTheDocument();
    expect(screen.getByText('Yarın')).toBeInTheDocument();
  });

  it('renders empty state when no follow-ups', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { upcomingFollowUps: [] } }),
    });

    render(<UpcomingFollowUps autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Yaklaşan follow-up bulunmuyor/i)).toBeInTheDocument();
    });
  });

  it('renders error state on fetch failure', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<UpcomingFollowUps autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/hata oluştu/i)).toBeInTheDocument();
    });
  });
});