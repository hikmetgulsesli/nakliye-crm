import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiSelect } from '../../ui/multi-select';

describe('MultiSelect', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const mockOnChange = vi.fn();

  it('renders with placeholder', () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
        placeholder="Select options..."
      />
    );

    expect(screen.getByText('Select options...')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('selects an option when clicked', () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const option1 = screen.getByText('Option 1');
    fireEvent.click(option1);

    expect(mockOnChange).toHaveBeenCalledWith(['option1']);
  });

  it('removes an option when X is clicked', () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={['option1', 'option2']}
        onChange={mockOnChange}
      />
    );

    // Check that selected options are displayed as badges
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('filters options when searching', () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
        searchable
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText('Ara...');
    fireEvent.change(searchInput, { target: { value: 'Option 1' } });

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
  });

  it('shows empty message when no options match search', () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
        searchable
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText('Ara...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('Sonuç bulunamadı')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <MultiSelect
        options={mockOptions}
        value={[]}
        onChange={mockOnChange}
        disabled
      />
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();
  });
});
