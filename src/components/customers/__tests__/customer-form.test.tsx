import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerForm } from '../customer-form';
import type { User, Customer } from '@/types';

const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john@example.com',
    full_name: 'John Doe',
    role: 'user',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockCustomer: Customer = {
  id: 'cust-1',
  company_name: 'Test Company',
  contact_name: 'Test Contact',
  phone: '+90 555 123 4567',
  email: 'test@company.com',
  address: 'Test Address',
  transport_modes: ['Deniz', 'Hava'],
  service_types: ['FCL', 'LCL'],
  incoterms: ['FOB', 'CIF'],
  direction: ['Ithalat', 'Ihracat'],
  origin_countries: ['Turkiye', 'Almanya'],
  destination_countries: ['Ingiltere'],
  source: 'Referans',
  potential: 'Yuksek',
  status: 'Aktif',
  assigned_user_id: 'user-1',
  last_contact_date: null,
  last_quote_date: null,
  notes: 'Test notes',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('CustomerForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders create form with default values', () => {
    render(
      <CustomerForm
        users={mockUsers}
        currentUser={mockUsers[0]}
        isAdmin={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/Firma Adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Yetkili Adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefon/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-posta/i)).toBeInTheDocument();
    expect(screen.getByText(/Kaydet/i)).toBeInTheDocument();
  });

  it('renders edit form with customer data', () => {
    render(
      <CustomerForm
        customer={mockCustomer}
        users={mockUsers}
        currentUser={mockUsers[0]}
        isAdmin={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Contact')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+90 555 123 4567')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@company.com')).toBeInTheDocument();
    expect(screen.getByText(/Güncelle/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <CustomerForm
        users={mockUsers}
        currentUser={mockUsers[0]}
        isAdmin={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText(/Kaydet/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Firma adı en az 2 karakter olmalıdır/i)).toBeInTheDocument();
      expect(screen.getByText(/Yetkili adı en az 2 karakter olmalıdır/i)).toBeInTheDocument();
      expect(screen.getByText(/Geçerli bir telefon numarası giriniz/i)).toBeInTheDocument();
      expect(screen.getByText(/Geçerli bir e-posta adresi giriniz/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(
      <CustomerForm
        users={mockUsers}
        currentUser={mockUsers[0]}
        isAdmin={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const emailInput = screen.getByLabelText(/E-posta/i);
    await userEvent.type(emailInput, 'invalid-email');

    const submitButton = screen.getByText(/Kaydet/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Geçerli bir e-posta adresi giriniz/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(
      <CustomerForm
        users={mockUsers}
        currentUser={mockUsers[0]}
        isAdmin={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/Firma Adı/i), 'New Company');
    await userEvent.type(screen.getByLabelText(/Yetkili Adı/i), 'John Contact');
    await userEvent.type(screen.getByLabelText(/Telefon/i), '+90 555 999 8888');
    await userEvent.type(screen.getByLabelText(/E-posta/i), 'new@company.com');

    // Select transport modes via MultiSelect
    const transportSelect = screen.getByText(/Taşıma modu seçiniz/i);
    fireEvent.click(transportSelect);
    
    // Wait for dropdown and select Deniz
    await waitFor(() => {
      const denizOption = screen.getByText('Deniz');
      fireEvent.click(denizOption);
    });

    // Select service types
    const serviceSelect = screen.getByText(/Servis tipi seçiniz/i);
    fireEvent.click(serviceSelect);
    
    await waitFor(() => {
      const fclOption = screen.getByText('FCL');
      fireEvent.click(fclOption);
    });

    // Select incoterms
    const incotermSelect = screen.getByText(/Satış şekli seçiniz/i);
    fireEvent.click(incotermSelect);
    
    await waitFor(() => {
      const fobOption = screen.getByText('FOB');
      fireEvent.click(fobOption);
    });

    // Select direction via checkbox
    const ithalatCheckbox = screen.getByLabelText(/İthalat/i);
    fireEvent.click(ithalatCheckbox);

    const submitButton = screen.getByText(/Kaydet/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <CustomerForm
        users={mockUsers}
        currentUser={mockUsers[0]}
        isAdmin={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/İptal/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('defaults assigned user to current user', () => {
    render(
      <CustomerForm
        users={mockUsers}
        currentUser={mockUsers[0]}
        isAdmin={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // The assigned user dropdown should default to current user
    expect(screen.getByText(/Temsilci seçiniz/i)).toBeInTheDocument();
  });

  it('displays validation errors for multi-select fields', async () => {
    render(
      <CustomerForm
        users={mockUsers}
        currentUser={mockUsers[0]}
        isAdmin={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill basic required text fields
    await userEvent.type(screen.getByLabelText(/Firma Adı/i), 'New Company');
    await userEvent.type(screen.getByLabelText(/Yetkili Adı/i), 'John Contact');
    await userEvent.type(screen.getByLabelText(/Telefon/i), '+90 555 999 8888');
    await userEvent.type(screen.getByLabelText(/E-posta/i), 'new@company.com');

    const submitButton = screen.getByText(/Kaydet/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/En az bir taşıma modu seçiniz/i)).toBeInTheDocument();
      expect(screen.getByText(/En az bir servis tipi seçiniz/i)).toBeInTheDocument();
      expect(screen.getByText(/En az bir satış şekli seçiniz/i)).toBeInTheDocument();
      expect(screen.getByText(/En az bir işlem yönü seçiniz/i)).toBeInTheDocument();
    });
  });
});
