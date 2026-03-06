import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, Column, FilterConfig, BulkAction } from './data-table';

interface TestRow {
  id: number;
  name: string;
  email: string;
  status: string;
}

const columns: Column<TestRow>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'status', header: 'Status' },
];

const data: TestRow[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
];

describe('DataTable', () => {
  const mockOnSort = vi.fn();
  const mockOnSelectionChange = vi.fn();
  const mockOnFilterChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  beforeEach(() => {
    mockOnSort.mockClear();
    mockOnSelectionChange.mockClear();
    mockOnFilterChange.mockClear();
    mockOnClearFilters.mockClear();
  });

  it('renders table headers correctly', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(row) => row.id}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders table data correctly', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(row) => row.id}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders empty message when no data', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyMessage="No data available"
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('calls onSort when sortable header is clicked', () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(row) => row.id}
        sortColumn="name"
        sortDirection="asc"
        onSort={mockOnSort}
      />
    );

    fireEvent.click(screen.getByText('Name'));
    expect(mockOnSort).toHaveBeenCalledWith('name');
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading
      />
    );

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  describe('Row Selection', () => {
    it('renders checkboxes when selectable is true', () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('selects all rows when header checkbox is clicked', async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await userEvent.click(headerCheckbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
    });

    it('deselects all rows when header checkbox is clicked again', async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={['1', '2', '3']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await userEvent.click(headerCheckbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    it('selects individual row when row checkbox is clicked', async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
      await userEvent.click(rowCheckboxes[0]);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
    });

    it('deselects individual row when row checkbox is clicked again', async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={['1', '2']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
      await userEvent.click(rowCheckboxes[0]);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['2']);
    });
  });

  describe('Filtering', () => {
    const filters: FilterConfig<TestRow>[] = [
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ]},
      { key: 'name', label: 'Name', type: 'text' },
    ];

    it('renders filter controls when filters are provided', () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          filters={filters}
        />
      );

      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('calls onFilterChange when filter value changes', async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          filters={filters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const statusFilter = screen.getByLabelText('Status');
      await userEvent.selectOptions(statusFilter, 'active');

      expect(mockOnFilterChange).toHaveBeenCalledWith('status', 'active');
    });

    it('calls onClearFilters when clear button is clicked', async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          filters={filters}
          filterValues={{ status: 'active' }}
          onClearFilters={mockOnClearFilters}
        />
      );

      const clearButton = screen.getByText('Filtreleri Temizle');
      await userEvent.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  describe('Bulk Actions', () => {
    const bulkActions: BulkAction<TestRow>[] = [
      { 
        label: 'Delete', 
        onClick: vi.fn(),
        variant: 'destructive'
      },
      { 
        label: 'Export', 
        onClick: vi.fn()
      },
    ];

    it('shows bulk actions when rows are selected', () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={['1', '2']}
          bulkActions={bulkActions}
        />
      );

      expect(screen.getByText('2 seçili')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('calls bulk action onClick with selected rows', async () => {
      const deleteAction = vi.fn();
      const actions: BulkAction<TestRow>[] = [
        { label: 'Delete', onClick: deleteAction, variant: 'destructive' },
      ];

      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={['1', '2']}
          bulkActions={actions}
        />
      );

      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      expect(deleteAction).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
      ]);
    });
  });

  describe('Pagination', () => {
    const pagination = {
      page: 1,
      pageSize: 10,
      total: 25,
      onPageChange: vi.fn(),
      onPageSizeChange: vi.fn(),
    };

    it('renders pagination controls when pagination is provided', () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={pagination}
        />
      );

      expect(screen.getByText('Toplam 25 kayıt')).toBeInTheDocument();
      expect(screen.getByText('Sayfa 1 / 3')).toBeInTheDocument();
    });

    it('calls onPageChange when next page button is clicked', async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={pagination}
        />
      );

      const nextButton = screen.getByText('Sonraki');
      await userEvent.click(nextButton);

      expect(pagination.onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageSizeChange when page size is changed', async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={pagination}
        />
      );

      const pageSizeSelect = screen.getByLabelText('Sayfa başına kayıt');
      await userEvent.selectOptions(pageSizeSelect, '25');

      expect(pagination.onPageSizeChange).toHaveBeenCalledWith(25);
    });

    it('disables previous button on first page', () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={{ ...pagination, page: 1 }}
        />
      );

      const prevButton = screen.getByText('Önceki');
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={{ ...pagination, page: 3 }}
        />
      );

      const nextButton = screen.getByText('Sonraki');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Custom Rendering', () => {
    it('uses custom render function for columns', () => {
      const customColumns: Column<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { 
          key: 'status', 
          header: 'Status',
          render: (row) => <span data-testid={`status-${row.id}`}>{row.status.toUpperCase()}</span>
        },
      ];

      render(
        <DataTable
          data={data}
          columns={customColumns}
          keyExtractor={(row) => row.id}
        />
      );

      expect(screen.getByTestId('status-1')).toHaveTextContent('ACTIVE');
    });

    it('respects column alignment', () => {
      const alignedColumns: Column<TestRow>[] = [
        { key: 'name', header: 'Name', align: 'left' },
        { key: 'email', header: 'Email', align: 'center' },
        { key: 'status', header: 'Status', align: 'right' },
      ];

      const { container } = render(
        <DataTable
          data={data}
          columns={alignedColumns}
          keyExtractor={(row) => row.id}
        />
      );

      const cells = container.querySelectorAll('tbody td');
      expect(cells[1]).toHaveClass('text-center');
      expect(cells[2]).toHaveClass('text-right');
    });
  });
});
