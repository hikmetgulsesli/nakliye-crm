import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersPage from '@/app/(dashboard)/users/page';

// Mock fetch
global.fetch = vi.fn();

const mockedFetch = fetch as unknown as ReturnType<typeof vi.fn>;

describe('UsersPage', () => {
  beforeEach(() => {
    mockedFetch.mockClear();
  });

  it('renders loading state initially', () => {
    mockedFetch.mockImplementation(() => new Promise(() => {}));
    render(<UsersPage />);
    
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument();
  });

  it('renders users after loading', async () => {
    const mockUsers = {
      data: [
        {
          id: '1',
          full_name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'user',
          is_active: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('renders empty state when no users', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }),
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Henüz kullanıcı bulunmuyor')).toBeInTheDocument();
    });
  });

  it('opens create user modal when button clicked', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }),
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Yeni Kullanıcı')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Yeni Kullanıcı'));

    await waitFor(() => {
      expect(screen.getByText('Yeni bir kullanıcı hesabı oluşturun')).toBeInTheDocument();
    });
  });

  it('displays user role badges correctly', async () => {
    const mockUsers = {
      data: [
        {
          id: '1',
          full_name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          full_name: 'Regular User',
          email: 'user@example.com',
          role: 'user',
          is_active: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Yönetici')).toBeInTheDocument();
      expect(screen.getByText('Kullanıcı')).toBeInTheDocument();
    });
  });
});
