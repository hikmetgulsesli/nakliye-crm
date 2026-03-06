import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('Sidebar', () => {
  const mockUsePathname = usePathname as unknown as ReturnType<typeof vi.fn>;
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('renders logo and brand name', () => {
    render(<Sidebar userRole="user" />);
    
    expect(screen.getByText('Nakliye CRM')).toBeInTheDocument();
  });

  it('renders navigation items for user role', () => {
    render(<Sidebar userRole="user" />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Müşteriler')).toBeInTheDocument();
    expect(screen.getByText('Teklifler')).toBeInTheDocument();
    expect(screen.getByText('Aktiviteler')).toBeInTheDocument();
  });

  it('renders admin-only items for admin role', () => {
    render(<Sidebar userRole="admin" />);
    
    expect(screen.getByText('Raporlar')).toBeInTheDocument();
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument();
    expect(screen.getByText('Ayarlar')).toBeInTheDocument();
  });

  it('does not render admin items for user role', () => {
    render(<Sidebar userRole="user" />);
    
    expect(screen.queryByText('Raporlar')).not.toBeInTheDocument();
    expect(screen.queryByText('Kullanıcılar')).not.toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Sidebar userRole="user" />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-blue-600');
  });

  it('calls onNavigate when link is clicked in mobile mode', () => {
    render(<Sidebar userRole="user" isMobile onNavigate={mockOnNavigate} />);
    
    const dashboardLink = screen.getByText('Dashboard');
    fireEvent.click(dashboardLink);
    
    expect(mockOnNavigate).toHaveBeenCalled();
  });

  it('renders profile link in footer', () => {
    render(<Sidebar userRole="user" />);
    
    expect(screen.getByText('Profil')).toBeInTheDocument();
  });
});
