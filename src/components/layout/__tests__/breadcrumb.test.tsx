import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '../breadcrumb';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('Breadcrumb', () => {
  const mockUsePathname = usePathname as unknown as ReturnType<typeof vi.fn>;

  it('renders nothing on root path', () => {
    mockUsePathname.mockReturnValue('/');
    const { container } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it('renders home link and current page', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Breadcrumb />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders nested paths correctly', () => {
    mockUsePathname.mockReturnValue('/users/123/edit');
    render(<Breadcrumb />);
    
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument();
  });

  it('marks last segment as active (not a link)', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Breadcrumb />);
    
    const dashboardText = screen.getByText('Dashboard');
    expect(dashboardText.tagName).toBe('SPAN');
  });

  it('applies custom className', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<Breadcrumb className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
