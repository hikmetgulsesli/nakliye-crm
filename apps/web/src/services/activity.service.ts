import api from '@/config/api';
import type {
  Activity,
  ActivityCreateInput,
  PaginatedResponse,
} from '@nakliye-crm/shared';

export interface ActivityFilters {
  customerId?: number;
  activityType?: string;
  outcome?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const activityService = {
  async getAll(
    page: number = 1,
    pageSize: number = 20,
    filters?: ActivityFilters,
  ): Promise<PaginatedResponse<Activity>> {
    const params: Record<string, unknown> = { page, pageSize };
    if (filters?.customerId) params.customerId = filters.customerId;
    if (filters?.activityType) params.activityType = filters.activityType;
    if (filters?.outcome) params.outcome = filters.outcome;
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;

    const { data } = await api.get<PaginatedResponse<Activity>>('/activities', { params });
    return data;
  },

  async getByCustomer(
    customerId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<Activity>> {
    const { data } = await api.get<PaginatedResponse<Activity>>(
      `/customers/${customerId}/activities`,
      { params: { page, pageSize } },
    );
    return data;
  },

  async create(input: ActivityCreateInput): Promise<Activity> {
    const { data } = await api.post<Activity>('/activities', input);
    return data;
  },

  async update(id: number, input: Partial<ActivityCreateInput>): Promise<Activity> {
    const { data } = await api.patch<Activity>(`/activities/${id}`, input);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/activities/${id}`);
  },
};
