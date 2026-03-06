import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from './multi-select';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
];

describe('MultiSelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with placeholder', () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
        placeholder="Select options"
      />
    );

    expect(screen.getByText('Select options')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('selects an option when clicked', async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const option1 = screen.getByText('Option 1');
    await userEvent.click(option1);

    expect(mockOnChange).toHaveBeenCalledWith(['1']);
  });

  it('deselects an option when clicked again', async () => {
    render(
      <MultiSelect
        options={options}
        value={['1']}
        onChange={mockOnChange}
      />
    );

    // Click on the trigger button (the main dropdown button)
    const trigger = screen.getByRole('button', { expanded: false });
    await userEvent.click(trigger);

    // Find the option in the listbox by role
    const option1 = screen.getByRole('option', { name: /option 1/i });
    await userEvent.click(option1);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('shows selected badges', () => {
    render(
      <MultiSelect
        options={options}
        value={['1', '2']}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('removes option via badge click', async () => {
    render(
      <MultiSelect
        options={options}
        value={['1', '2']}
        onChange={mockOnChange}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /seçimini kaldır/i });
    await userEvent.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith(['2']);
  });

  it('filters options when searching', async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const searchInput = screen.getByLabelText('Seçeneklerde ara');
    await userEvent.type(searchInput, 'Option 2');

    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('selects all enabled options', async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
        showSelectAll={true}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const selectAllButton = screen.getByText('Tümünü Seç');
    await userEvent.click(selectAllButton);

    expect(mockOnChange).toHaveBeenCalledWith(['1', '2', '3']);
  });

  it('clears all selections', async () => {
    render(
      <MultiSelect
        options={options}
        value={['1', '2', '3']}
        onChange={mockOnChange}
        showSelectAll={true}
      />
    );

    // Click on the trigger button (the main dropdown button)
    const trigger = screen.getByRole('button', { expanded: false });
    await userEvent.click(trigger);

    const clearButton = screen.getByText('Seçimi Temizle');
    await userEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('handles keyboard navigation', async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    trigger.focus();

    // Open with Enter
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Navigate with ArrowDown
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    
    // Select with Enter
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('does not select disabled options', async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
        showSelectAll={true}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const selectAllButton = screen.getByText('Tümünü Seç');
    await userEvent.click(selectAllButton);

    // Should not include disabled option (Option 4)
    expect(mockOnChange).toHaveBeenCalledWith(['1', '2', '3']);
  });

  it('has correct ARIA attributes', () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
        id="test-multiselect"
        aria-label="Test Multiselect"
      />
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-label', 'Test Multiselect');
  });

  it('disables interaction when disabled prop is true', async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={mockOnChange}
        disabled
      />
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();

    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
