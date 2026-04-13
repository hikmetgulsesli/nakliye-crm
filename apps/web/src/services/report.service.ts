import api from '@/config/api';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  userId?: number;
  region?: string;
}

export type ReportType =
  | 'periodic_quotes'
  | 'staff_performance'
  | 'win_loss_analysis'
  | 'country_mode_volume'
  | 'loss_reason_analysis';

export type ExportFormat = 'pdf' | 'excel';

export interface ReportSummary {
  type: ReportType;
  title: string;
  generatedAt: string;
  data: Record<string, unknown>;
}

export const reportService = {
  async getReport(type: ReportType, filters?: ReportFilters): Promise<ReportSummary> {
    const params: Record<string, unknown> = { type };
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.userId) params.userId = filters.userId;
    if (filters?.region) params.region = filters.region;

    const { data } = await api.get<ReportSummary>('/reports', { params });
    return data;
  },

  async exportReport(
    type: ReportType,
    format: ExportFormat,
    filters?: ReportFilters,
  ): Promise<Blob> {
    const params: Record<string, unknown> = { type, format };
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.userId) params.userId = filters.userId;
    if (filters?.region) params.region = filters.region;

    const { data } = await api.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    return data;
  },
};
