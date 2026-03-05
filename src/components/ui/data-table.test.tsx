import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from './data-table';

interface TestRow {
  id: number;
  name: string;
  email: string;
}

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
];

const data: TestRow[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

describe('DataTable', () => {
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
    const onSort = vi.fn();
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(row) => row.id}
        sortColumn="name"
        sortDirection="asc"
        onSort={onSort}
      />
    );

    fireEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name');
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

    // Loading skeleton should be present (animate-pulse class)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
