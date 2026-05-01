import api from '@/config/api';

// ----------------------------------------------------------------------------
// Tipler
// ----------------------------------------------------------------------------

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  /** Cok secimli temsilci filtresi */
  assignedUserIds?: number[];
  transportMode?: string;
  currency?: string;
}

export interface TrendInfo {
  value: number;
  positive: boolean;
  label: string;
}

export interface KPIWithTrend {
  value: number;
  trend?: TrendInfo;
}

export interface OverviewData {
  kpis: {
    totalQuotes: KPIWithTrend;
    wonQuotes: KPIWithTrend;
    lostQuotes: KPIWithTrend;
    pendingQuotes: KPIWithTrend;
    winRate: KPIWithTrend;
    activeCustomers: KPIWithTrend;
    newCustomers: KPIWithTrend;
    wonValueByCurrency: Record<string, number>;
  };
  statusDistribution: Array<{ status: string; count: number }>;
  monthlyTrend: Array<{ month: string; total: number; won: number; lost: number; winRate: number }>;
  range: { start: string; end: string };
}

export interface TeamMemberStats {
  userId: number;
  fullName: string;
  role: 'ADMIN' | 'USER';
  avatarUrl?: string | null;
  totalQuotes: number;
  wonQuotes: number;
  lostQuotes: number;
  pendingQuotes: number;
  winRate: number;
  wonValue: Record<string, number>;
  activities: number;
  customers: number;
  lastActivityAt: string | null;
  goals: Record<string, { target: number; actual: number; pct: number }>;
}

export interface TeamPerformanceData {
  members: TeamMemberStats[];
  summary: {
    quotes: number;
    won: number;
    lost: number;
    activities: number;
    winRate: number;
  };
}

export interface QuoteFunnelData {
  funnel: Array<{ stage: string; count: number; color: string }>;
  statusDistribution: Array<{ status: string; count: number; percentage: number; color: string }>;
  lossReasons: Array<{ reason: string; count: number; value: number; percentage: number }>;
  metrics: {
    total: number;
    winRate: number;
    lossRate: number;
    avgRevisions: number;
    avgCycleDays: number;
    avgWonValue: Array<{ currency: string; avg: number; total: number; count: number }>;
  };
}

export interface CustomerSegmentsData {
  total: number;
  newInPeriod: number;
  byPotential: Array<{ key: string; count: number }>;
  bySource: Array<{ key: string; count: number }>;
  byStatus: Array<{ key: string; count: number }>;
  byDirection: Array<{ key: string; count: number }>;
  contactBuckets: Array<{ label: string; key: string; count: number; color: string }>;
  churnDistribution: Array<{ level: string; key: string; count: number; color: string }>;
}

export interface LaneAnalysisData {
  lanes: Array<{
    origin: string;
    destination: string;
    count: number;
    won: number;
    winRate: number;
    wonValue: number;
  }>;
  origins: Array<{ country: string; count: number }>;
  destinations: Array<{ country: string; count: number }>;
  transportModes: Array<{ mode: string; count: number; won: number; winRate: number }>;
  serviceTypes: Array<{ service: string; count: number }>;
  incoterms: Array<{ incoterm: string; count: number }>;
}

export interface ActivityHeatmapData {
  /** [gun][saat] sayisi (gun=0 Pazartesi ... 6 Pazar) */
  heatmap: number[][];
  byType: Array<{ type: string; count: number }>;
  byUser: Array<{ userId: number; fullName: string; count: number }>;
  summary: {
    totalActivities: number;
    totalMinutes: number;
    avgPerDay: number;
  };
}

export interface RevenueTrendData {
  series: Array<Record<string, string | number>>;
  currencies: string[];
  totals: Record<string, number>;
  wonCount: number;
}

export interface TopCustomer {
  customerId: number;
  companyName: string;
  potential: string | null;
  quoteCount: number;
  wonCount: number;
  winRate: number;
  wonValue: Record<string, number>;
  primaryValue: number;
}

export interface TopCustomersData {
  byQuoteCount: TopCustomer[];
  byWonCount: TopCustomer[];
  byValue: TopCustomer[];
}

export interface PipelineQuote {
  id: number;
  quoteNo: string;
  customerName: string;
  assignedUserName: string;
  quoteDate: string;
  validityDate: string;
  ageDays: number;
  isExpired: boolean;
  price: number;
  currency: string;
}

export interface PipelineUserStat {
  userId: number;
  fullName: string;
  count: number;
  value: Record<string, number>;
  avgAgeDays: number;
}

export interface PipelineData {
  summary: {
    total: number;
    expectedValue: Record<string, number>;
    expired: number;
    avgAgeDays: number;
  };
  ageBuckets: Array<{
    key: string;
    label: string;
    count: number;
    value: Record<string, number>;
    color: string;
  }>;
  oldest: PipelineQuote[];
  byUser: PipelineUserStat[];
}

export interface DelayedShipment {
  id: number;
  shipmentNo: string;
  customerName: string;
  transportMode: string | null;
  origin: string | null;
  destination: string | null;
  eta: string | null;
  delayDays: number;
  status: string;
}

export interface UpcomingShipment {
  id: number;
  shipmentNo: string;
  customerName: string;
  transportMode: string | null;
  origin: string | null;
  destination: string | null;
  eta: string | null;
  status: string;
}

export interface ShipmentsData {
  summary: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
  };
  statusDistribution: Array<{ status: string; count: number }>;
  transportModes: Array<{ mode: string; count: number }>;
  delayed: DelayedShipment[];
  upcoming: UpcomingShipment[];
  monthlyTrend: Array<{ month: string; count: number }>;
}

// ----------------------------------------------------------------------------
// Yardimcilar
// ----------------------------------------------------------------------------

function buildParams(filters?: AnalyticsFilters): Record<string, unknown> {
  if (!filters) return {};
  const params: Record<string, unknown> = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.transportMode) params.transportMode = filters.transportMode;
  if (filters.currency) params.currency = filters.currency;
  if (filters.assignedUserIds && filters.assignedUserIds.length > 0) {
    params.assignedUserIds = filters.assignedUserIds.join(',');
  }
  return params;
}

async function fetchAnalytics<T>(path: string, filters?: AnalyticsFilters): Promise<T> {
  // api.ts'deki response interceptor zaten { success, data } envelope'unu acar.
  const { data } = await api.get<T>(`/reports/analytics/${path}`, {
    params: buildParams(filters),
  });
  return data;
}

// ----------------------------------------------------------------------------
// Service
// ----------------------------------------------------------------------------

export const analyticsService = {
  getOverview: (filters?: AnalyticsFilters) =>
    fetchAnalytics<OverviewData>('overview', filters),

  getTeamPerformance: (filters?: AnalyticsFilters) =>
    fetchAnalytics<TeamPerformanceData>('team-performance', filters),

  getQuoteFunnel: (filters?: AnalyticsFilters) =>
    fetchAnalytics<QuoteFunnelData>('quote-funnel', filters),

  getCustomerSegments: (filters?: AnalyticsFilters) =>
    fetchAnalytics<CustomerSegmentsData>('customer-segments', filters),

  getLaneAnalysis: (filters?: AnalyticsFilters) =>
    fetchAnalytics<LaneAnalysisData>('lane-analysis', filters),

  getActivityHeatmap: (filters?: AnalyticsFilters) =>
    fetchAnalytics<ActivityHeatmapData>('activity-heatmap', filters),

  getRevenueTrend: (filters?: AnalyticsFilters) =>
    fetchAnalytics<RevenueTrendData>('revenue-trend', filters),

  getTopCustomers: (filters?: AnalyticsFilters) =>
    fetchAnalytics<TopCustomersData>('top-customers', filters),

  getPipeline: (filters?: AnalyticsFilters) =>
    fetchAnalytics<PipelineData>('pipeline', filters),

  getShipments: (filters?: AnalyticsFilters) =>
    fetchAnalytics<ShipmentsData>('shipments', filters),
};
