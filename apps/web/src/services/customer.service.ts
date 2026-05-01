import api from '@/config/api';
import type {
  Customer,
  CustomerCreateInput,
  CustomerUpdateInput,
  PaginatedResponse,
} from '@nakliye-crm/shared';

export interface CustomerFilters {
  search?: string;
  status?: string;
  potential?: string;
  transportMode?: string;
  assignedUserId?: number;
  serviceType?: string;
  originCountry?: string;
  destinationCountry?: string;
  incoterm?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  deleted?: boolean;
}

export interface ConflictMatch {
  customerId: number;
  companyName: string;
  contactName?: string | null;
  phone: string;
  email: string;
  similarity: number;
  matchType: 'phone' | 'email' | 'name';
  assignedUserName?: string;
  lastContactDate?: string | null;
}

export type ConflictCheckResponse = ConflictMatch[];

export const customerService = {
  async getAll(
    page: number = 1,
    pageSize: number = 20,
    filters?: CustomerFilters,
  ): Promise<PaginatedResponse<Customer>> {
    const params: Record<string, unknown> = { page, pageSize };
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.potential) params.potential = filters.potential;
    if (filters?.transportMode) params.transportMode = filters.transportMode;
    if (filters?.assignedUserId) params.assignedUserId = filters.assignedUserId;
    if (filters?.serviceType) params.serviceType = filters.serviceType;
    if (filters?.originCountry) params.originCountry = filters.originCountry;
    if (filters?.destinationCountry) params.destinationCountry = filters.destinationCountry;
    if (filters?.incoterm) params.incoterm = filters.incoterm;
    if (filters?.source) params.source = filters.source;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.deleted) params.deleted = 'true';

    const { data } = await api.get<PaginatedResponse<Customer>>('/customers', { params });
    return data;
  },

  async getById(id: number): Promise<Customer> {
    const { data } = await api.get<Customer>(`/customers/${id}`);
    return data;
  },

  async create(input: CustomerCreateInput): Promise<Customer> {
    const { data } = await api.post<Customer>('/customers', input);
    return data;
  },

  async update(id: number, input: CustomerUpdateInput): Promise<Customer> {
    const { data } = await api.patch<Customer>(`/customers/${id}`, input);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async restore(id: number): Promise<Customer> {
    const { data } = await api.patch<Customer>(`/customers/${id}/restore`);
    return data;
  },

  async conflictCheck(
    phone: string,
    email: string,
    companyName: string,
  ): Promise<ConflictCheckResponse> {
    const { data } = await api.post<ConflictCheckResponse>('/customers/conflict-check', {
      phone,
      email,
      companyName,
    });
    return data || [];
  },
};
