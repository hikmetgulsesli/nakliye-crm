import api from '@/config/api';

export type ReportType = 'periodic-quotes' | 'staff-performance' | 'win-loss' | 'country-mode-volume' | 'loss-reasons';
export type ExportFormat = 'pdf' | 'excel';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  assignedUserId?: number;
  transportMode?: string;
  currency?: string;
}

export interface ReportSummary {
  type: ReportType;
  title: string;
  generatedAt: string;
  data: Record<string, unknown>;
}

function buildParams(filters?: ReportFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  if (filters?.assignedUserId) params.assignedUserId = filters.assignedUserId;
  if (filters?.transportMode) params.transportMode = filters.transportMode;
  if (filters?.currency) params.currency = filters.currency;
  return params;
}

export const reportService = {
  async getPeriodicQuotes(filters?: ReportFilters): Promise<ReportSummary> {
    const { data } = await api.get<ReportSummary>('/reports/periodic-quotes', {
      params: buildParams(filters),
    });
    return data;
  },

  async getStaffPerformance(filters?: ReportFilters): Promise<ReportSummary> {
    const { data } = await api.get<ReportSummary>('/reports/staff-performance', {
      params: buildParams(filters),
    });
    return data;
  },

  async getWinLoss(filters?: ReportFilters): Promise<ReportSummary> {
    const { data } = await api.get<ReportSummary>('/reports/win-loss', {
      params: buildParams(filters),
    });
    return data;
  },

  async getCountryModeVolume(filters?: ReportFilters): Promise<ReportSummary> {
    const { data } = await api.get<ReportSummary>('/reports/country-mode-volume', {
      params: buildParams(filters),
    });
    return data;
  },

  async getLossReasons(filters?: ReportFilters): Promise<ReportSummary> {
    const { data } = await api.get<ReportSummary>('/reports/loss-reasons', {
      params: buildParams(filters),
    });
    return data;
  },

  async getReport(type: ReportType, filters?: ReportFilters): Promise<ReportSummary> {
    const methodMap: Record<ReportType, (f?: ReportFilters) => Promise<ReportSummary>> = {
      'periodic-quotes': (f) => reportService.getPeriodicQuotes(f),
      'staff-performance': (f) => reportService.getStaffPerformance(f),
      'win-loss': (f) => reportService.getWinLoss(f),
      'country-mode-volume': (f) => reportService.getCountryModeVolume(f),
      'loss-reasons': (f) => reportService.getLossReasons(f),
    };
    return methodMap[type](filters);
  },

  async exportReport(
    reportType: ReportType,
    format: ExportFormat,
    filters?: ReportFilters,
  ): Promise<Blob> {
    const params = buildParams(filters);
    params.reportType = reportType;

    const { data } = await api.get(`/reports/export/${format}`, {
      params,
      responseType: 'blob',
    });

    // Trigger browser download
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const filename = `rapor_${reportType}_${new Date().toISOString().slice(0, 10)}.${extension}`;
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return data;
  },
};
