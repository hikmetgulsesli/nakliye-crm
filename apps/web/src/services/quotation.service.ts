import api from '@/config/api';
import type {
  Quotation,
  QuotationCreateInput,
  QuotationUpdateInput,
  QuotationRevision,
  PaginatedResponse,
} from '@nakliye-crm/shared';

export interface QuotationFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  transportMode?: string;
  assignedUserId?: number;
  currency?: string;
  originCountry?: string;
  destinationCountry?: string;
  serviceType?: string;
  incoterm?: string;
  olderThanDays?: number;
  expired?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const quotationService = {
  async getAll(
    page: number = 1,
    pageSize: number = 20,
    filters?: QuotationFilters,
  ): Promise<PaginatedResponse<Quotation>> {
    const params: Record<string, unknown> = { page, pageSize };
    if (filters?.search) params.search = filters.search;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.status) params.status = filters.status;
    if (filters?.transportMode) params.transportMode = filters.transportMode;
    if (filters?.assignedUserId) params.assignedUserId = filters.assignedUserId;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.originCountry) params.originCountry = filters.originCountry;
    if (filters?.destinationCountry) params.destinationCountry = filters.destinationCountry;
    if (filters?.serviceType) params.serviceType = filters.serviceType;
    if (filters?.incoterm) params.incoterm = filters.incoterm;
    if (filters?.olderThanDays) params.olderThanDays = filters.olderThanDays;
    if (filters?.expired) params.expired = '1';
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const { data } = await api.get<PaginatedResponse<Quotation>>('/quotations', { params });
    return data;
  },

  async getById(id: number): Promise<Quotation> {
    const { data } = await api.get<Quotation>(`/quotations/${id}`);
    return data;
  },

  async create(input: QuotationCreateInput): Promise<Quotation> {
    const { data } = await api.post<Quotation>('/quotations', input);
    return data;
  },

  async update(id: number, input: QuotationUpdateInput): Promise<Quotation> {
    const { data } = await api.patch<Quotation>(`/quotations/${id}`, input);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/quotations/${id}`);
  },

  async restore(id: number): Promise<Quotation> {
    const { data } = await api.patch<Quotation>(`/quotations/${id}/restore`);
    return data;
  },

  async getRevisions(quotationId: number): Promise<QuotationRevision[]> {
    const { data } = await api.get<QuotationRevision[]>(
      `/quotations/${quotationId}/revisions`,
    );
    return data;
  },
};
