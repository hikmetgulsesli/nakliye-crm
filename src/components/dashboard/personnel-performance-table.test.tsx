import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PersonnelPerformanceTable } from './personnel-performance-table';
import type { PersonnelPerformance } from '@/types';

describe('PersonnelPerformanceTable', () => {
  const mockData: PersonnelPerformance[] = [
    {
      userId: 1,
      userName: 'Ahmet Yılmaz',
      totalQuotes: 50,
      wonQuotes: 30,
      lostQuotes: 10,
      winRate: 75.0,
      totalRevenue: 50000,
      avgQuoteValue: 1000,
    },
    {
      userId: 2,
      userName: 'Mehmet Kaya',
      totalQuotes: 40,
      wonQuotes: 20,
      lostQuotes: 15,
      winRate: 57.1,
      totalRevenue: 35000,
      avgQuoteValue: 875,
    },
    {
      userId: 3,
      userName: 'Ayşe Demir',
      totalQuotes: 30,
      wonQuotes: 15,
      lostQuotes: 5,
      winRate: 75.0,
      totalRevenue: 25000,
      avgQuoteValue: 833,
    },
  ];

  it('renders loading state correctly', () => {
    render(<PersonnelPerformanceTable data={[]} loading={true} />);
    
    expect(screen.getByText('Personel Performansı')).toBeInTheDocument();
    // Loading state shows animated pulse element
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    render(<PersonnelPerformanceTable data={mockData} loading={false} />);
    
    expect(screen.getByText('Temsilci')).toBeInTheDocument();
    expect(screen.getByText('Teklif')).toBeInTheDocument();
    expect(screen.getByText('Kazanma')).toBeInTheDocument();
    expect(screen.getByText('Kaybetme')).toBeInTheDocument();
    expect(screen.getByText('Oran')).toBeInTheDocument();
    expect(screen.getByText('Gelir')).toBeInTheDocument();
    expect(screen.getByText('Ort. Değer')).toBeInTheDocument();
  });

  it('renders all personnel rows correctly', () => {
    render(<PersonnelPerformanceTable data={mockData} loading={false} />);
    
    expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
    expect(screen.getByText('Mehmet Kaya')).toBeInTheDocument();
    expect(screen.getByText('Ayşe Demir')).toBeInTheDocument();
  });

  it('displays correct quote counts', () => {
    render(<PersonnelPerformanceTable data={mockData} loading={false} />);
    
    const rows = screen.getAllByRole('row');
    
    // Skip header row
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('50')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('30')).toBeInTheDocument();
    expect(within(firstDataRow).getByText('10')).toBeInTheDocument();
  });

  it('displays correct win rates with formatting', () => {
    render(<PersonnelPerformanceTable data={mockData} loading={false} />);
    
    // There are two users with 75% win rate, so use getAllByText
    expect(screen.getAllByText('%75.0')).toHaveLength(2);
    expect(screen.getByText('%57.1')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<PersonnelPerformanceTable data={mockData} loading={false} />);
    
    // Check for currency formatted values
    expect(screen.getByText('$50.000')).toBeInTheDocument();
    expect(screen.getByText('$35.000')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<PersonnelPerformanceTable data={[]} loading={false} />);
    
    expect(screen.getByText('Bu dönem için veri bulunamadı')).toBeInTheDocument();
  });

  it('renders ranking indicators for top 3', () => {
    render(<PersonnelPerformanceTable data={mockData} loading={false} />);
    
    const rows = screen.getAllByRole('row');
    
    // First place should have special styling (amber/gold)
    const firstRow = rows[1];
    expect(within(firstRow).getByText('1')).toBeInTheDocument();
    
    // Second place
    const secondRow = rows[2];
    expect(within(secondRow).getByText('2')).toBeInTheDocument();
    
    // Third place
    const thirdRow = rows[3];
    expect(within(thirdRow).getByText('3')).toBeInTheDocument();
  });

  it('applies correct color coding to win/loss columns', () => {
    render(<PersonnelPerformanceTable data={mockData} loading={false} />);
    
    // Find the first wonQuotes cell (30 for Ahmet Yılmaz) and check parent has correct class
    const wonCells = screen.getAllByText('30');
    // The first occurrence should be in the first data row
    const parentCell = wonCells[0]?.closest('td');
    expect(parentCell).toHaveClass('text-emerald-600');
  });
});
