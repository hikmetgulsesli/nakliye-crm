import api from '@/config/api';

// --- Types ---

export interface KPIData {
  label: string;
  value: number | string;
  icon: string;
  iconColor: string;
  trend?: { value: string; positive: boolean };
  extra?: string; // e.g. "Stabil" badge text
}

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
  quoteCount: number;
  wonCount: number;
  winRate: number;
  contactedCustomers: number;
  lastActivity: string;
  isTopPerformer?: boolean;
}

export interface CountryData {
  country: string;
  flag: string;
  percentage: number;
  count: number;
}

export interface TransportModeData {
  mode: string;
  percentage: number;
  color: string;
}

export interface LossReasonData {
  reason: string;
  percentage: number;
  count: number;
}

export interface AlertData {
  id: string;
  type: 'uncalled' | 'pending' | 'expired' | 'highPotential';
  count: number;
  description: string;
}

export interface FollowUpItem {
  id: string;
  customerName: string;
  date: string;
  type: 'call' | 'email' | 'meeting';
  note?: string;
}

export interface RecentActivity {
  id: string;
  date: string;
  customerName: string;
  customerId?: number;
  type: string;
  note: string;
  representative?: string;
}

export interface AdminDashboardData {
  kpis: KPIData[];
  teamPerformance: TeamMember[];
  originCountries: CountryData[];
  destinationCountries: CountryData[];
  transportModes: TransportModeData[];
  lossReasons: LossReasonData[];
}

export interface UserDashboardData {
  kpis: KPIData[];
  alerts: AlertData[];
  followUps: FollowUpItem[];
  recentActivities: RecentActivity[];
}

// --- Service ---

export const dashboardService = {
  async getAdminDashboard(period: string = 'this_month'): Promise<AdminDashboardData> {
    const { data } = await api.get<AdminDashboardData>('/dashboard/admin', {
      params: { period },
    });
    return data;
  },

  async getUserDashboard(): Promise<UserDashboardData> {
    const { data } = await api.get<UserDashboardData>('/dashboard/user');
    return data;
  },

  async getAlerts(): Promise<AlertData[]> {
    const { data } = await api.get<AlertData[]>('/dashboard/alerts');
    return data;
  },
};
