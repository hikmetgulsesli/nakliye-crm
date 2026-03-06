import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Breadcrumb } from '@/components/layout/breadcrumb';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

const mockedUsePathname = usePathname as unknown as ReturnType<typeof vi.fn>;

describe('Breadcrumb', () => {
  it('renders nothing on dashboard page', () => {
    mockedUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing on root page', () => {
    mockedUsePathname.mockReturnValue('/');
    const { container } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumb for users page', () => {
    mockedUsePathname.mockReturnValue('/users');
    render(<Breadcrumb />);
    
    expect(screen.getByText('Ana Sayfa')).toBeInTheDocument();
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument();
  });

  it('renders breadcrumb for customers page', () => {
    mockedUsePathname.mockReturnValue('/customers');
    render(<Breadcrumb />);
    
    expect(screen.getByText('Müşteriler')).toBeInTheDocument();
  });

  it('renders breadcrumb for nested paths', () => {
    mockedUsePathname.mockReturnValue('/customers/123/edit');
    render(<Breadcrumb />);
    
    expect(screen.getByText('Ana Sayfa')).toBeInTheDocument();
    expect(screen.getByText('Müşteriler')).toBeInTheDocument();
    expect(screen.getByText('Düzenle')).toBeInTheDocument();
  });
});
