import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminMetricsCards } from './admin-metrics-cards';
import type { AdminDashboardMetrics } from '@/types';

describe('AdminMetricsCards', () => {
  const mockMetrics: AdminDashboardMetrics = {
    totalQuotes: 150,
    winRate: 65.5,
    activeCustomers: 80,
    highPotentialCustomers: 25,
    totalRevenue: 125000,
    pendingQuotes: 30,
    wonQuotes: 100,
    lostQuotes: 20,
  };

  it('renders loading state correctly', () => {
    render(<AdminMetricsCards metrics={null} loading={true} />);
    
    // Loading state shows animated pulse elements for 7 metric cards
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThanOrEqual(7);
  });

  it('renders all primary metrics correctly', () => {
    render(<AdminMetricsCards metrics={mockMetrics} loading={false} />);
    
    // Primary metrics
    expect(screen.getByText('Toplam Teklif')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    
    expect(screen.getByText('Kazanma Oranı')).toBeInTheDocument();
    expect(screen.getByText('65.5%')).toBeInTheDocument();
    
    expect(screen.getByText('Aktif Müşteri')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    
    expect(screen.getByText('Yüksek Potansiyel')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders all secondary metrics correctly', () => {
    render(<AdminMetricsCards metrics={mockMetrics} loading={false} />);
    
    // Secondary metrics
    expect(screen.getByText('Toplam Gelir')).toBeInTheDocument();
    expect(screen.getByText('$125.000')).toBeInTheDocument();
    
    expect(screen.getByText('Bekleyen Teklif')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    
    expect(screen.getByText('Kaybedilen Teklif')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(<AdminMetricsCards metrics={mockMetrics} loading={false} />);
    
    // Check currency formatting with Turkish locale (dot as thousands separator)
    expect(screen.getByText('$125.000')).toBeInTheDocument();
  });

  it('formats percentage correctly', () => {
    render(<AdminMetricsCards metrics={mockMetrics} loading={false} />);
    
    // Percentage uses toFixed(1) which uses period as decimal separator
    expect(screen.getByText('65.5%')).toBeInTheDocument();
  });

  it('renders error state when metrics is null', () => {
    render(<AdminMetricsCards metrics={null} loading={false} />);
    
    expect(screen.getByText('Metrikler yüklenemedi')).toBeInTheDocument();
  });

  it('renders with zero values correctly', () => {
    const zeroMetrics: AdminDashboardMetrics = {
      totalQuotes: 0,
      winRate: 0,
      activeCustomers: 0,
      highPotentialCustomers: 0,
      totalRevenue: 0,
      pendingQuotes: 0,
      wonQuotes: 0,
      lostQuotes: 0,
    };
    
    render(<AdminMetricsCards metrics={zeroMetrics} loading={false} />);
    
    // Check zero values are displayed (winRate shows 0.0%)
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // winRate with 1 decimal
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});
