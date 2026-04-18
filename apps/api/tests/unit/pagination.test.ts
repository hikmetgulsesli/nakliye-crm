import { describe, it, expect } from 'vitest';
import { parsePagination, paginatedResponse } from '../../src/utils/pagination';

describe('parsePagination', () => {
  it('defaults to page=1, pageSize=20', () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 20, skip: 0 });
  });

  it('clamps page to at least 1', () => {
    expect(parsePagination({ page: '-5' })).toEqual({ page: 1, pageSize: 20, skip: 0 });
  });

  it('clamps pageSize to at most 100', () => {
    const p = parsePagination({ pageSize: '999' });
    expect(p.pageSize).toBe(100);
  });

  it('computes skip correctly', () => {
    expect(parsePagination({ page: '3', pageSize: '10' })).toEqual({
      page: 3,
      pageSize: 10,
      skip: 20,
    });
  });
});

describe('paginatedResponse', () => {
  it('wraps data with pagination metadata', () => {
    const result = paginatedResponse(['a', 'b'], 45, { page: 2, pageSize: 20, skip: 20 });
    expect(result).toEqual({
      success: true,
      data: ['a', 'b'],
      total: 45,
      page: 2,
      pageSize: 20,
      totalPages: 3,
    });
  });
});
