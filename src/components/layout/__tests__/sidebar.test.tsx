import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('Sidebar', () => {
  const mockUsePathname = usePathname as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('renders logo and brand name', () => {
    render(<Sidebar userRole="user" userName="Test User" />);
    
    expect(screen.getByText('Nakliye CRM')).toBeInTheDocument();
  });

  it('renders navigation items for user role', () => {
    render(<Sidebar userRole="user" userName="Test User" />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Müşteriler')).toBeInTheDocument();
    expect(screen.getByText('Teklifler')).toBeInTheDocument();
    expect(screen.getByText('Aktiviteler')).toBeInTheDocument();
  });

  it('renders admin-only items for admin role', () => {
    render(<Sidebar userRole="admin" userName="Admin User" />);
    
    expect(screen.getByText('Raporlar')).toBeInTheDocument();
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument();
    expect(screen.getByText('Ayarlar')).toBeInTheDocument();
  });

  it('does not render admin items for user role', () => {
    render(<Sidebar userRole="user" userName="Test User" />);
    
    expect(screen.queryByText('Raporlar')).not.toBeInTheDocument();
    expect(screen.queryByText('Kullanıcılar')).not.toBeInTheDocument();
  });

  it('shows user name in footer', () => {
    render(<Sidebar userRole="user" userName="Test User" />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
