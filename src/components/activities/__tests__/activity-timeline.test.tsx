import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityTimeline } from '../activity-timeline';
import type { ActivityWithUser } from '@/types/index.js';

const mockActivities: ActivityWithUser[] = [
  {
    id: '1',
    customer_id: 'cust-1',
    type: 'Telefon',
    date: '2026-03-05T10:00:00Z',
    duration: 30,
    notes: 'Müşteri ile fiyat görüşmesi yapıldı',
    outcome: 'Olumlu',
    next_action_date: '2026-03-10',
    created_by: 'user-1',
    created_at: '2026-03-05T10:00:00Z',
    updated_at: '2026-03-05T10:00:00Z',
    created_by_user: {
      id: 'user-1',
      full_name: 'Ahmet Yılmaz',
    },
  },
  {
    id: '2',
    customer_id: 'cust-1',
    type: 'E-posta',
    date: '2026-03-01T14:00:00Z',
    duration: null,
    notes: 'Teklif detayları gönderildi',
    outcome: 'Teklif Istendi',
    next_action_date: null,
    created_by: 'user-2',
    created_at: '2026-03-01T14:00:00Z',
    updated_at: '2026-03-01T14:00:00Z',
    created_by_user: {
      id: 'user-2',
      full_name: 'Mehmet Kaya',
    },
  },
];

describe('ActivityTimeline', () => {
  it('renders loading state', () => {
    render(<ActivityTimeline activities={[]} onAddActivity={() => {}} loading />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty state when no activities', () => {
    render(<ActivityTimeline activities={[]} onAddActivity={() => {}} />);
    expect(screen.getByText('Henüz aktivite bulunmuyor')).toBeInTheDocument();
  });

  it('renders activities list', () => {
    render(<ActivityTimeline activities={mockActivities} onAddActivity={() => {}} />);
    
    expect(screen.getByText('Aktivite Geçmişi')).toBeInTheDocument();
    expect(screen.getByText('Müşteri ile fiyat görüşmesi yapıldı')).toBeInTheDocument();
    expect(screen.getByText('Teklif detayları gönderildi')).toBeInTheDocument();
  });

  it('displays activity types', () => {
    render(<ActivityTimeline activities={mockActivities} onAddActivity={() => {}} />);
    
    expect(screen.getByText('Telefon')).toBeInTheDocument();
    expect(screen.getByText('E-posta')).toBeInTheDocument();
  });

  it('displays outcome badges', () => {
    render(<ActivityTimeline activities={mockActivities} onAddActivity={() => {}} />);
    
    expect(screen.getByText('Olumlu')).toBeInTheDocument();
    expect(screen.getByText('Teklif Istendi')).toBeInTheDocument();
  });

  it('displays duration information', () => {
    render(<ActivityTimeline activities={mockActivities} onAddActivity={() => {}} />);
    
    expect(screen.getByText('30 dk')).toBeInTheDocument();
    expect(screen.getByText('Süre belirtilmemiş')).toBeInTheDocument();
  });

  it('displays creator information', () => {
    render(<ActivityTimeline activities={mockActivities} onAddActivity={() => {}} />);
    
    expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
    expect(screen.getByText('Mehmet Kaya')).toBeInTheDocument();
  });

  it('displays next action date when present', () => {
    render(<ActivityTimeline activities={mockActivities} onAddActivity={() => {}} />);
    
    expect(screen.getByText(/Sonraki aksiyon:/)).toBeInTheDocument();
  });

  it('calls onAddActivity when button clicked', () => {
    const handleAddActivity = vi.fn();
    render(<ActivityTimeline activities={mockActivities} onAddActivity={handleAddActivity} />);
    
    const addButton = screen.getByText('Aktivite Ekle');
    fireEvent.click(addButton);
    
    expect(handleAddActivity).toHaveBeenCalledTimes(1);
  });

  it('calls onAddActivity from empty state', () => {
    const handleAddActivity = vi.fn();
    render(<ActivityTimeline activities={[]} onAddActivity={handleAddActivity} />);
    
    const addButton = screen.getByText('Aktivite Ekle');
    fireEvent.click(addButton);
    
    expect(handleAddActivity).toHaveBeenCalledTimes(1);
  });
});
