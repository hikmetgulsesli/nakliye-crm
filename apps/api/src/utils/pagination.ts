export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query.pageSize || '50'), 10)));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams) {
  return {
    success: true,
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  };
}

/**
 * Whitelist tabanli orderBy parser. Frontend `?sortBy=quoteDate&sortOrder=desc`
 * gonderir; controller bu util'e izinli alanlarin listesini ve default'u verir.
 *
 * - allowedFields'da olmayan bir sortBy gelirse default'a duser (ilk eleman).
 * - sortOrder 'asc' veya 'desc' disindaysa 'desc'.
 *
 * Yan iliskileri (ornek: musteri.companyName) icin caller `nested` mapper'i
 * verebilir: { customerName: { customer: { companyName: ? } } }.
 */
export interface ParseSortOptions<T extends string> {
  allowedFields: readonly T[];
  defaultField: T;
  defaultOrder?: 'asc' | 'desc';
  /** allowedFields'taki bir alan dot-path icin Prisma orderBy'a transform edilebilir. */
  nested?: Partial<Record<T, (order: SortOrder) => SortOrderInput>>;
}

export type SortOrder = 'asc' | 'desc';
// Prisma'nin orderBy parametresinin yumusak tipi: { field: 'asc' | 'desc' } veya
// nested ilski icin { rel: { field: 'asc' | 'desc' } }.
export type SortOrderInput = { [key: string]: SortOrder | SortOrderInput };

export function parseSort<T extends string>(
  query: Record<string, unknown>,
  opts: ParseSortOptions<T>,
): SortOrderInput {
  const rawField = String(query.sortBy || '').trim() as T;
  const rawOrder = String(query.sortOrder || '').trim().toLowerCase();

  const field = opts.allowedFields.includes(rawField) ? rawField : opts.defaultField;
  const order: SortOrder =
    rawOrder === 'asc' || rawOrder === 'desc'
      ? (rawOrder as SortOrder)
      : (opts.defaultOrder ?? 'desc');

  const nested = opts.nested?.[field];
  if (nested) return nested(order);
  return { [field]: order };
}
