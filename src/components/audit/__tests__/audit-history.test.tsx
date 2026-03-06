import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditHistory } from '../audit-history';
import type { AuditLogWithUser } from '@/types/index';

const mockLogs: AuditLogWithUser[] = [
  {
    id: '1',
    user_id: 'user-1',
    record_type: 'customer',
    record_id: 'cust-1',
    action: 'create',
    changes: null,
    metadata: null,
    created_at: '2026-03-05T10:00:00Z',
    user: {
      id: 'user-1',
      full_name: 'Ahmet Yılmaz',
    },
  },
  {
    id: '2',
    user_id: 'user-1',
    record_type: 'customer',
    record_id: 'cust-1',
    action: 'update',
    changes: {
      company_name: { old: 'ABC Ltd', new: 'ABC Ltd. Şti.' },
      phone: { old: '555-0000', new: '555-1111' },
    },
    metadata: null,
    created_at: '2026-03-05T11:00:00Z',
    user: {
      id: 'user-1',
      full_name: 'Ahmet Yılmaz',
    },
  },
  {
    id: '3',
    user_id: 'user-2',
    record_type: 'customer',
    record_id: 'cust-1',
    action: 'assign',
    changes: {
      assigned_user_id: { old: 'user-1', new: 'user-2' },
    },
    metadata: null,
    created_at: '2026-03-06T09:00:00Z',
    user: {
      id: 'user-2',
      full_name: 'Mehmet Kaya',
    },
  },
];

describe('AuditHistory', () => {
  it('renders loading state', () => {
    render(<AuditHistory logs={[]} loading />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty state when no logs', () => {
    render(<AuditHistory logs={[]} />);
    expect(screen.getByText('Kayıt bulunamadı')).toBeInTheDocument();
    expect(screen.getByText('Bu kayıt için henüz bir işlem geçmişi bulunmuyor.')).toBeInTheDocument();
  });

  it('renders audit logs list', () => {
    render(<AuditHistory logs={mockLogs} />);
    
    expect(screen.getByText('Oluşturuldu')).toBeInTheDocument();
    expect(screen.getByText('Güncellendi')).toBeInTheDocument();
    expect(screen.getByText('Atama yapıldı')).toBeInTheDocument();
  });

  it('displays user names', () => {
    render(<AuditHistory logs={mockLogs} />);
    
    expect(screen.getByText(/Ahmet Yılmaz tarafından/)).toBeInTheDocument();
    expect(screen.getByText(/Mehmet Kaya tarafından/)).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    render(<AuditHistory logs={mockLogs} />);
    
    // Check for date grouping headers
    expect(screen.getAllByText(/5 Mart 2026/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/6 Mart 2026/).length).toBeGreaterThan(0);
  });

  it('expands changes when clicked', () => {
    render(<AuditHistory logs={mockLogs} />);
    
    const showChangesButton = screen.getAllByText('Değişiklikleri gör')[0];
    fireEvent.click(showChangesButton);
    
    expect(screen.getByText('Firma Adı:')).toBeInTheDocument();
    expect(screen.getByText('ABC Ltd')).toBeInTheDocument();
    expect(screen.getByText('ABC Ltd. Şti.')).toBeInTheDocument();
  });

  it('collapses changes when clicked again', () => {
    render(<AuditHistory logs={mockLogs} />);
    
    const showChangesButton = screen.getAllByText('Değişiklikleri gör')[0];
    fireEvent.click(showChangesButton);
    expect(screen.getByText('Firma Adı:')).toBeInTheDocument();
    
    const hideChangesButton = screen.getByText('Değişiklikleri gizle');
    fireEvent.click(hideChangesButton);
    
    expect(screen.queryByText('Firma Adı:')).not.toBeInTheDocument();
  });

  it('displays action icons for different actions', () => {
    render(<AuditHistory logs={mockLogs} />);
    
    // All three actions should be rendered
    expect(screen.getAllByText(/Oluşturuldu|Güncellendi|Atama yapıldı/).length).toBe(3);
  });
});