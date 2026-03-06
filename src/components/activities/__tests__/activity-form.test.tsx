import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityForm } from '../activity-form';

describe('ActivityForm', () => {
  const defaultProps = {
    customerId: 'cust-1',
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    loading: false,
  };

  it('renders all form fields', () => {
    render(<ActivityForm {...defaultProps} />);
    
    expect(screen.getByText('Aktivite Tipi')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tarih ve Saat/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Süre/i)).toBeInTheDocument();
    expect(screen.getByText('Görüşme Sonucu')).toBeInTheDocument();
    expect(screen.getByLabelText(/Görüşme Notu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sonraki Aksiyon Tarihi/i)).toBeInTheDocument();
  });

  it('renders activity type options', () => {
    render(<ActivityForm {...defaultProps} />);
    
    expect(screen.getByText('Telefon')).toBeInTheDocument();
    expect(screen.getByText('E-posta')).toBeInTheDocument();
    expect(screen.getByText('Yüz Yüze')).toBeInTheDocument();
    expect(screen.getByText('Video Görüşme')).toBeInTheDocument();
  });

  it('renders outcome options', () => {
    render(<ActivityForm {...defaultProps} />);
    
    expect(screen.getByText('Olumlu')).toBeInTheDocument();
    expect(screen.getByText('Nötr')).toBeInTheDocument();
    expect(screen.getByText('Olumsuz')).toBeInTheDocument();
    expect(screen.getByText('Teklif İstendi')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<ActivityForm {...defaultProps} />);
    
    const cancelButton = screen.getByText('İptal');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('submits form with valid data', async () => {
    render(<ActivityForm {...defaultProps} />);
    
    // Fill in notes
    const notesInput = screen.getByLabelText(/Görüşme Notu/i);
    fireEvent.change(notesInput, { target: { value: 'Test görüşme notu' } });
    
    // Submit form
    const submitButton = screen.getByText('Kaydet');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
    
    const submittedData = defaultProps.onSubmit.mock.calls[0][0];
    expect(submittedData.customer_id).toBe('cust-1');
    expect(submittedData.notes).toBe('Test görüşme notu');
    expect(submittedData.type).toBeDefined();
    expect(submittedData.outcome).toBeDefined();
  });

  it('shows validation error for empty notes', async () => {
    render(<ActivityForm {...defaultProps} />);
    
    // Try to submit without notes
    const submitButton = screen.getByText('Kaydet');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Not alanı zorunludur')).toBeInTheDocument();
    });
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button when loading', () => {
    render(<ActivityForm {...defaultProps} loading />);
    
    const submitButton = screen.getByText('Kaydediliyor...');
    expect(submitButton).toBeDisabled();
  });

  it('allows selecting different activity types', () => {
    render(<ActivityForm {...defaultProps} />);
    
    const emailButton = screen.getByText('E-posta');
    fireEvent.click(emailButton);
    
    // The button should now have selected styling
    expect(emailButton).toHaveClass('border-slate-900');
  });

  it('allows selecting different outcomes', () => {
    render(<ActivityForm {...defaultProps} />);
    
    const positiveButton = screen.getByText('Olumlu');
    fireEvent.click(positiveButton);
    
    // The button should now have selected styling
    expect(positiveButton).toHaveClass('ring-2');
  });

  it('includes duration in submitted data', async () => {
    render(<ActivityForm {...defaultProps} />);
    
    // Fill in duration
    const durationInput = screen.getByLabelText(/Süre/i);
    fireEvent.change(durationInput, { target: { value: '45' } });
    
    // Fill in notes
    const notesInput = screen.getByLabelText(/Görüşme Notu/i);
    fireEvent.change(notesInput, { target: { value: 'Test görüşme' } });
    
    // Submit form
    const submitButton = screen.getByText('Kaydet');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
    
    const submittedData = defaultProps.onSubmit.mock.calls[0][0];
    expect(submittedData.duration).toBe(45);
  });
});