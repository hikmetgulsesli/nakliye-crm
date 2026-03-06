import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertList } from '../alert-list.js';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('AlertList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAlert = {
    id: 'alert-1',
    type: 'no_contact_14d' as const,
    title: '14 Gündür İletişim Yok',
    description: 'Test Company ile 15 gündür iletişim kurulmamış.',
    entity_type: 'customer' as const,
    entity_id: 'customer-1',
    entity_name: 'Test Company',
    severity: 'medium' as const,
    status: 'active' as const,
    assigned_user_id: 'user-1',
    assigned_user_name: 'Test User',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    reviewed_at: null,
    reviewed_by: null,
    reviewed_by_name: null,
  };

  it('renders loading state initially', () => {
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
    
    render(<AlertList />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays alerts after loading', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [mockAlert] }),
    } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByText('14 Gündür İletişim Yok')).toBeInTheDocument();
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });
  });

  it('displays empty state when no alerts', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByText(/No alerts found/i)).toBeInTheDocument();
      expect(screen.getByText(/All caught up!/i)).toBeInTheDocument();
    });
  });

  it('displays error state when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch alerts/i)).toBeInTheDocument();
    });
  });

  it('allows retry after error', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch alerts/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/Retry/i);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('marks alert as reviewed when review button clicked', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockAlert] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockAlert, status: 'reviewed' } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Mark as reviewed/i)).toBeInTheDocument();
    });

    const reviewButton = screen.getByLabelText(/Mark as reviewed/i);
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/alerts/alert-1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('review'),
        })
      );
    });
  });

  it('dismisses alert when dismiss button clicked', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockAlert] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockAlert, status: 'dismissed' } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Dismiss/i)).toBeInTheDocument();
    });

    const dismissButton = screen.getByLabelText(/Dismiss/i);
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/alerts/alert-1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('dismiss'),
        })
      );
    });
  });

  it('applies filter when type is selected', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByText(/Filters:/i)).toBeInTheDocument();
    });

    const typeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(typeSelect, { target: { value: 'no_contact_14d' } });

    const applyButton = screen.getByText(/Apply/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=no_contact_14d'),
        expect.any(Object)
      );
    });
  });

  it('shows link to customer for customer entity type', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [mockAlert] }),
    } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByText(/View Customer/i)).toBeInTheDocument();
    });
  });

  it('displays correct badges for each alert', async () => {
    const alertWithAllFields = {
      ...mockAlert,
      type: 'expired_quote' as const,
      severity: 'high' as const,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [alertWithAllFields] }),
    } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByText(/high/i)).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  it('shows assigned user name when available', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [mockAlert] }),
    } as Response);

    render(<AlertList />);

    await waitFor(() => {
      expect(screen.getByText(/Assigned: Test User/i)).toBeInTheDocument();
    });
  });
});
