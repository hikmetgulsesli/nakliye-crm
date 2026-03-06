import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar, MobileSidebar } from '@/components/layout/sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('Sidebar', () => {
  it('renders navigation items for admin user', () => {
    render(<Sidebar userRole="admin" userName="Test Admin" />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Müşteriler')).toBeInTheDocument();
    expect(screen.getByText('Teklifler')).toBeInTheDocument();
    expect(screen.getByText('Aktiviteler')).toBeInTheDocument();
    expect(screen.getByText('Raporlar')).toBeInTheDocument();
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument();
    expect(screen.getByText('Ayarlar')).toBeInTheDocument();
  });

  it('renders only user navigation items for regular user', () => {
    render(<Sidebar userRole="user" userName="Test User" />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Müşteriler')).toBeInTheDocument();
    expect(screen.getByText('Teklifler')).toBeInTheDocument();
    expect(screen.getByText('Aktiviteler')).toBeInTheDocument();
    
    // Admin-only items should not be present
    expect(screen.queryByText('Raporlar')).not.toBeInTheDocument();
    expect(screen.queryByText('Kullanıcılar')).not.toBeInTheDocument();
    expect(screen.queryByText('Ayarlar')).not.toBeInTheDocument();
  });

  it('displays user name and role', () => {
    render(<Sidebar userRole="admin" userName="John Doe" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('has logout button', () => {
    render(<Sidebar userRole="admin" userName="John Doe" />);
    
    expect(screen.getByText('Çıkış Yap')).toBeInTheDocument();
  });
});

describe('MobileSidebar', () => {
  it('renders hamburger menu button', () => {
    render(<MobileSidebar userRole="admin" userName="Test User" />);
    
    expect(screen.getByLabelText('Menüyü Aç')).toBeInTheDocument();
  });
});
