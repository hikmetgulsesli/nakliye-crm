import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersTable } from '../users-table';
import type { User } from '@/types';

// Mock fetch
global.fetch = vi.fn();

describe('UsersTable', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@test.com',
      full_name: 'Admin User',
      role: 'admin',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: '2',
      email: 'user@test.com',
      full_name: 'Regular User',
      role: 'user',
      is_active: true,
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders users table with data', () => {
    render(<UsersTable initialUsers={mockUsers} />);
    
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('filters users by search term', async () => {
    render(<UsersTable initialUsers={mockUsers} />);
    
    const searchInput = screen.getByPlaceholderText('Kullanıcı ara...');
    await userEvent.type(searchInput, 'Admin');
    
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.queryByText('Regular User')).not.toBeInTheDocument();
  });

  it('shows empty state when no users match search', async () => {
    render(<UsersTable initialUsers={mockUsers} />);
    
    const searchInput = screen.getByPlaceholderText('Kullanıcı ara...');
    await userEvent.type(searchInput, 'nonexistent');
    
    expect(screen.getByText('Kullanıcı bulunamadı')).toBeInTheDocument();
  });

  it('opens create user modal when button clicked', async () => {
    render(<UsersTable initialUsers={mockUsers} />);
    
    const createButton = screen.getByText('Yeni Kullanıcı');
    fireEvent.click(createButton);
    
    expect(screen.getByText('Yeni Kullanıcı Oluştur')).toBeInTheDocument();
  });

  it('displays user roles with correct badges', () => {
    render(<UsersTable initialUsers={mockUsers} />);
    
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Kullanıcı')).toBeInTheDocument();
  });

  it('shows user status with toggle switch', () => {
    render(<UsersTable initialUsers={mockUsers} />);
    
    const toggles = screen.getAllByRole('switch');
    expect(toggles.length).toBe(2);
    expect(toggles[0]).toBeChecked();
  });

  it('opens edit modal when edit button clicked', async () => {
    render(<UsersTable initialUsers={mockUsers} />);
    
    const editButtons = screen.getAllByRole('button', { name: '' });
    const firstEditButton = editButtons[0];
    fireEvent.click(firstEditButton);
    
    await waitFor(() => {
      expect(screen.getByText('Kullanıcı Düzenle')).toBeInTheDocument();
    });
  });
});
