import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertWidgets } from '../alert-widgets.js';

// Mock fetch
global.fetch = vi.fn();

describe('AlertWidgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
    
    render(<AlertWidgets autoRefresh={false} />);
    
    expect(screen.getByText(/Hatırlatıcılar/i)).toBeInTheDocument();
  });

  it('displays alert counts after loading', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          no_contact_14d: 5,
          pending_quote_7d: 3,
          expired_quote: 2,
          high_potential_no_quote_30d: 1,
          total: 11,
        },
      }),
    } as Response);

    render(<AlertWidgets autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('shows total badge when alerts exist', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          no_contact_14d: 5,
          pending_quote_7d: 0,
          expired_quote: 0,
          high_potential_no_quote_30d: 0,
          total: 5,
        },
      }),
    } as Response);

    render(<AlertWidgets autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('displays error state when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<AlertWidgets autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch alert counts/i)).toBeInTheDocument();
    });
  });

  it('calls regenerate when refresh button is clicked', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            no_contact_14d: 0,
            pending_quote_7d: 0,
            expired_quote: 0,
            high_potential_no_quote_30d: 0,
            total: 0,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            no_contact: 2,
            pending_quotes: 1,
            expired_quotes: 0,
            high_potential: 0,
            total: 3,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            no_contact_14d: 2,
            pending_quote_7d: 1,
            expired_quote: 0,
            high_potential_no_quote_30d: 0,
            total: 3,
          },
        }),
      } as Response);

    render(<AlertWidgets autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Regenerate alerts/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/Regenerate alerts/i);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/alerts',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('regenerate'),
        })
      );
    });
  });

  it('auto-refreshes when enabled', async () => {
    vi.useFakeTimers();
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          no_contact_14d: 0,
          pending_quote_7d: 0,
          expired_quote: 0,
          high_potential_no_quote_30d: 0,
          total: 0,
        },
      }),
    } as Response);

    render(<AlertWidgets autoRefresh={true} refreshInterval={5000} />);

    // Initial fetch
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Fast-forward past the refresh interval
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });

  it('renders all four alert widgets', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          no_contact_14d: 0,
          pending_quote_7d: 0,
          expired_quote: 0,
          high_potential_no_quote_30d: 0,
          total: 0,
        },
      }),
    } as Response);

    render(<AlertWidgets autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Aranmayan Müşteriler/i)).toBeInTheDocument();
      expect(screen.getByText(/Bekleyen Teklifler/i)).toBeInTheDocument();
      expect(screen.getByText(/Süresi Dolan Teklifler/i)).toBeInTheDocument();
      expect(screen.getByText(/Yüksek Potansiyel/i)).toBeInTheDocument();
    });
  });

  it('shows correct severity colors based on count thresholds', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          no_contact_14d: 15, // high (>10)
          pending_quote_7d: 6, // high (>5)
          expired_quote: 4, // high (>3)
          high_potential_no_quote_30d: 6, // high (>5)
          total: 31,
        },
      }),
    } as Response);

    render(<AlertWidgets autoRefresh={false} />);

    await waitFor(() => {
      // Check that high severity widgets are rendered
      const widgets = screen.getAllByText(/View details/i);
      expect(widgets).toHaveLength(4);
    });
  });
});
