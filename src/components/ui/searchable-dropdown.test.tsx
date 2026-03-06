import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableDropdown } from './searchable-dropdown';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
];

describe('SearchableDropdown', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with placeholder', () => {
    render(
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
        placeholder="Select an option"
      />
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    render(
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('selects an option when clicked', async () => {
    render(
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const option1 = screen.getByText('Option 1');
    await userEvent.click(option1);

    expect(mockOnChange).toHaveBeenCalledWith('1', expect.objectContaining({ value: '1', label: 'Option 1' }));
  });

  it('shows selected option label', async () => {
    render(
      <SearchableDropdown
        options={options}
        value="2"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('clears selection when clear button clicked', async () => {
    render(
      <SearchableDropdown
        options={options}
        value="2"
        onChange={mockOnChange}
        clearable
      />
    );

    const clearButton = screen.getByLabelText('Seçimi temizle');
    await userEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('filters options when searching', async () => {
    render(
      <SearchableDropdown
        options={options}
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

  it('calls onSearch with debounced query', async () => {
    const mockOnSearch = vi.fn();
    render(
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
        onSearch={mockOnSearch}
        debounceMs={300}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const searchInput = screen.getByLabelText('Seçeneklerde ara');
    await userEvent.type(searchInput, 'test');

    // Wait for debounce
    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });
  });

  it('loads options asynchronously', async () => {
    const mockLoadOptions = vi.fn().mockResolvedValue([
      { value: 'async1', label: 'Async Option 1' },
      { value: 'async2', label: 'Async Option 2' },
    ]);

    render(
      <SearchableDropdown
        onChange={mockOnChange}
        loadOptions={mockLoadOptions}
        debounceMs={300}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const searchInput = screen.getByLabelText('Seçeneklerde ara');
    await userEvent.type(searchInput, 'async');

    vi.advanceTimersByTime(400);

    await waitFor(() => {
      expect(mockLoadOptions).toHaveBeenCalledWith('async');
    });

    // Wait for async options to load
    await waitFor(() => {
      expect(screen.getByText('Async Option 1')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching', async () => {
    const mockLoadOptions = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(
      <SearchableDropdown
        onChange={mockOnChange}
        loadOptions={mockLoadOptions}
        debounceMs={300}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const searchInput = screen.getByLabelText('Seçeneklerde ara');
    await userEvent.type(searchInput, 'test');

    vi.advanceTimersByTime(400);

    // Loading spinner should be visible (Loader2 icon with animate-spin class)
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(
      <SearchableDropdown
        options={options}
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
      <SearchableDropdown
        options={options}
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
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const disabledOption = screen.getByText('Option 4');
    await userEvent.click(disabledOption);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('shows empty message when no options', async () => {
    render(
      <SearchableDropdown
        options={[]}
        onChange={mockOnChange}
        emptyMessage="No options available"
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    expect(screen.getByText('No options available')).toBeInTheDocument();
  });

  it('shows no results message when search has no matches', async () => {
    render(
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
        noResultsMessage="No matching results"
      />
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);

    const searchInput = screen.getByLabelText('Seçeneklerde ara');
    await userEvent.type(searchInput, 'nonexistent');

    expect(screen.getByText('No matching results')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
        id="test-dropdown"
        aria-label="Test Dropdown"
      />
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-label', 'Test Dropdown');
  });

  it('disables interaction when disabled prop is true', async () => {
    render(
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
        disabled
      />
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();

    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('respects external loading state', () => {
    render(
      <SearchableDropdown
        options={options}
        onChange={mockOnChange}
        loading
      />
    );

    // Loading spinner should be visible (Loader2 icon with animate-spin class)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
