import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickActions } from './quick-actions';

describe('QuickActions', () => {
  it('renders all quick action buttons', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('Müşteri Ekle')).toBeInTheDocument();
    expect(screen.getByText('Teklif Oluştur')).toBeInTheDocument();
    expect(screen.getByText('Aktivite Kaydet')).toBeInTheDocument();
  });

  it('renders action descriptions', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('Yeni müşteri kartı oluştur')).toBeInTheDocument();
    expect(screen.getByText('Yeni fiyat teklifi hazırla')).toBeInTheDocument();
    expect(screen.getByText('Görüşme notu ekle')).toBeInTheDocument();
  });

  it('has correct links for each action', () => {
    render(<QuickActions />);
    
    const addCustomerLink = screen.getByText('Müşteri Ekle').closest('a');
    const createQuoteLink = screen.getByText('Teklif Oluştur').closest('a');
    const logActivityLink = screen.getByText('Aktivite Kaydet').closest('a');
    
    expect(addCustomerLink).toHaveAttribute('href', '/customers/new');
    expect(createQuoteLink).toHaveAttribute('href', '/quotations/new');
    expect(logActivityLink).toHaveAttribute('href', '/activities/new');
  });
});