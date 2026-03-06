import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuotationsTable } from '../quotations-table';
import type { QuotationWithRelations } from '@/types/quotations';

const mockQuotations: QuotationWithRelations[] = [
  {
    id: '1',
    quote_no: 'TKF-2026-0001',
    customer_id: 'c1',
    quote_date: '2026-03-01',
    validity_date: '2026-03-15',
    transport_mode: 'Deniz',
    service_type: 'FCL',
    origin_country: 'Turkiye',
    destination_country: 'Almanya',
    pol: 'Istanbul',
    pod: 'Hamburg',
    incoterm: 'FOB',
    price: 2500,
    currency: 'USD',
    price_note: null,
    status: 'Bekliyor',
    loss_reason: null,
    assigned_user_id: 'u1',
    revision_count: 0,
    created_by: 'u1',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    customer: {
      id: 'c1',
      company_name: 'ABC Ltd.',
      contact_name: 'Ahmet Yılmaz',
    },
    assigned_user: {
      id: 'u1',
      full_name: 'Test User',
    },
    created_by_user: {
      id: 'u1',
      full_name: 'Test User',
    },
  },
  {
    id: '2',
    quote_no: 'TKF-2026-0002',
    customer_id: 'c2',
    quote_date: '2026-03-02',
    validity_date: '2026-03-16',
    transport_mode: 'Hava',
    service_type: 'LCL',
    origin_country: 'Turkiye',
    destination_country: 'Fransa',
    pol: null,
    pod: null,
    incoterm: 'CIF',
    price: 1500,
    currency: 'EUR',
    price_note: 'Ekstra sigorta dahil',
    status: 'Kazanildi',
    loss_reason: null,
    assigned_user_id: 'u2',
    revision_count: 1,
    created_by: 'u1',
    created_at: '2026-03-02T10:00:00Z',
    updated_at: '2026-03-02T10:00:00Z',
    customer: {
      id: 'c2',
      company_name: 'XYZ Corp',
      contact_name: 'Mehmet Demir',
    },
    assigned_user: {
      id: 'u2',
      full_name: 'Another User',
    },
    created_by_user: {
      id: 'u1',
      full_name: 'Test User',
    },
  },
];

describe('QuotationsTable', () => {
  it('renders quotations correctly', () => {
    render(
      <QuotationsTable
        quotations={mockQuotations}
        isAdmin={false}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByText('TKF-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('TKF-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('ABC Ltd.')).toBeInTheDocument();
    expect(screen.getByText('XYZ Corp')).toBeInTheDocument();
  });

  it('filters quotations by search term', () => {
    render(
      <QuotationsTable
        quotations={mockQuotations}
        isAdmin={false}
        onRefresh={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText('Teklif ara...');
    fireEvent.change(searchInput, { target: { value: 'ABC' } });

    expect(screen.getByText('ABC Ltd.')).toBeInTheDocument();
    expect(screen.queryByText('XYZ Corp')).not.toBeInTheDocument();
  });

  it('filters quotations by status', () => {
    render(
      <QuotationsTable
        quotations={mockQuotations}
        isAdmin={false}
        onRefresh={() => {}}
      />
    );

    const statusSelect = screen.getByDisplayValue('Tümü');
    fireEvent.change(statusSelect, { target: { value: 'Kazanildi' } });

    expect(screen.queryByText('ABC Ltd.')).not.toBeInTheDocument();
    expect(screen.getByText('XYZ Corp')).toBeInTheDocument();
  });

  it('shows admin delete option when isAdmin is true', () => {
    render(
      <QuotationsTable
        quotations={mockQuotations}
        isAdmin={true}
        onRefresh={() => {}}
      />
    );

    const menuButtons = screen.getAllByRole('button', { name: /open menu/i });
    expect(menuButtons.length).toBeGreaterThan(0);
  });
});
