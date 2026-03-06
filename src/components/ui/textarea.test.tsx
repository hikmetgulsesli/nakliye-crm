import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders with default props', () => {
    render(<Textarea />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Textarea label="Description" />);
    
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Textarea helperText="Enter a brief description" />);
    
    expect(screen.getByText('Enter a brief description')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(<Textarea error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders with placeholder', () => {
    render(<Textarea placeholder="Type here..." />);
    
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'Hello World');
    
    expect(textarea).toHaveValue('Hello World');
  });

  it('respects disabled state', () => {
    render(<Textarea disabled />);
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('respects readOnly state', () => {
    render(<Textarea readOnly />);
    
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('has correct ARIA attributes with error', () => {
    render(<Textarea error="Error message" id="test-textarea" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-error');
  });

  it('has correct ARIA attributes with helper text', () => {
    render(<Textarea helperText="Helper text" id="test-textarea" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-describedby', 'test-textarea-helper');
  });

  it('associates label with textarea via htmlFor', () => {
    render(<Textarea id="custom-id" label="Description" />);
    
    const label = screen.getByText('Description');
    const textarea = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'custom-id');
    expect(textarea).toHaveAttribute('id', 'custom-id');
  });

  it('applies custom className', () => {
    const { container } = render(<Textarea className="custom-class" />);
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
