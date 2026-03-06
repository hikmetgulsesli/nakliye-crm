import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('renders pagination info correctly', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('1-10 / 50 kayıt')).toBeInTheDocument();
  });

  it('renders page numbers correctly', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onPageChange when page button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByText('2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    const prevButton = screen.getByLabelText('Önceki sayfa');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    const nextButton = screen.getByLabelText('Sonraki sayfa');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageSizeChange when page size is changed', () => {
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const select = screen.getByLabelText('Sayfa başı kayıt sayısı');
    fireEvent.change(select, { target: { value: '20' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });
});
