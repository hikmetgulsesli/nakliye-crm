import api from '@/config/api';
import type { AuditLog, PaginatedResponse } from '@nakliye-crm/shared';

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  recordType?: string;
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  async getAll(
    page: number = 1,
    pageSize: number = 20,
    filters?: AuditLogFilters,
  ): Promise<PaginatedResponse<AuditLog>> {
    const params: Record<string, unknown> = { page, pageSize };
    if (filters?.userId) params.userId = filters.userId;
    if (filters?.action) params.action = filters.action;
    if (filters?.recordType) params.recordType = filters.recordType;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const { data } = await api.get<PaginatedResponse<AuditLog>>('/audit', { params });
    return data;
  },

  async getByRecord(recordType: string, recordId: number): Promise<AuditLog[]> {
    const { data } = await api.get<AuditLog[]>(`/audit/record/${recordType}/${recordId}`);
    return data;
  },

  async exportCsv(filters?: AuditLogFilters): Promise<Blob> {
    const params: Record<string, unknown> = {};
    if (filters?.userId) params.userId = filters.userId;
    if (filters?.action) params.action = filters.action;
    if (filters?.recordType) params.recordType = filters.recordType;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const { data } = await api.get('/audit/export/csv', {
      params,
      responseType: 'blob',
    });
    return data;
  },
};
