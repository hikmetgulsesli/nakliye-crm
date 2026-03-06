import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangeFilter } from './date-range-filter';

describe('DateRangeFilter', () => {
  const mockOnDateChange = vi.fn();
  const mockOnExportPDF = vi.fn();

  const defaultProps = {
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    onDateChange: mockOnDateChange,
    onExportPDF: mockOnExportPDF,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders date inputs correctly', () => {
    render(<DateRangeFilter {...defaultProps} />);
    
    expect(screen.getByLabelText('Başlangıç Tarihi')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('Bitiş Tarihi')).toHaveValue('2026-01-31');
  });

  it('renders preset buttons', () => {
    render(<DateRangeFilter {...defaultProps} />);
    
    expect(screen.getByText('Son 7 Gün')).toBeInTheDocument();
    expect(screen.getByText('Son 30 Gün')).toBeInTheDocument();
    expect(screen.getByText('Son 90 Gün')).toBeInTheDocument();
  });

  it('renders apply and export buttons', () => {
    render(<DateRangeFilter {...defaultProps} />);
    
    expect(screen.getByText('Uygula')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('calls onDateChange when apply button is clicked', () => {
    render(<DateRangeFilter {...defaultProps} />);
    
    const applyButton = screen.getByText('Uygula');
    fireEvent.click(applyButton);
    
    expect(mockOnDateChange).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
  });

  it('calls onDateChange when preset button is clicked', () => {
    render(<DateRangeFilter {...defaultProps} />);
    
    const sevenDaysButton = screen.getByText('Son 7 Gün');
    fireEvent.click(sevenDaysButton);
    
    expect(mockOnDateChange).toHaveBeenCalled();
    const callArgs = mockOnDateChange.mock.calls[0];
    expect(callArgs[0]).toBeDefined();
    expect(callArgs[1]).toBeDefined();
  });

  it('calls onExportPDF when export button is clicked', () => {
    render(<DateRangeFilter {...defaultProps} />);
    
    const exportButton = screen.getByText('PDF');
    fireEvent.click(exportButton);
    
    expect(mockOnExportPDF).toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    render(<DateRangeFilter {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Uygula')).toBeDisabled();
    expect(screen.getByText('PDF')).toBeDisabled();
    expect(screen.getByText('Son 7 Gün')).toBeDisabled();
    expect(screen.getByText('Son 30 Gün')).toBeDisabled();
    expect(screen.getByText('Son 90 Gün')).toBeDisabled();
  });

  it('updates local state when date inputs change', () => {
    render(<DateRangeFilter {...defaultProps} />);
    
    const startDateInput = screen.getByLabelText('Başlangıç Tarihi');
    fireEvent.change(startDateInput, { target: { value: '2026-02-01' } });
    
    expect(startDateInput).toHaveValue('2026-02-01');
  });

  it('renders without export button when onExportPDF is not provided', () => {
    const propsWithoutExport = {
      ...defaultProps,
      onExportPDF: undefined,
    };
    
    render(<DateRangeFilter {...propsWithoutExport} />);
    
    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
  });
});
