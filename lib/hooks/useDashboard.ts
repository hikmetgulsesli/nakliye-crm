"use client";

import { useState, useEffect, useCallback } from "react";

interface UserMetrics {
  weeklyQuotes: number;
  monthlyQuotes: number;
  monthlyWon: number;
  monthlyWinRate: number;
  contactedCustomers: number;
}

interface FollowUp {
  id: string;
  type: string;
  subject: string | null;
  dueDate: string | null;
  customer: {
    id: string;
    companyName: string;
  } | null;
}

interface CustomerToCall {
  id: string;
  companyName: string;
  totalActivities: number;
}

interface PendingQuote {
  id: string;
  quoteNumber: string;
  status: string;
  updatedAt: string;
  customer: {
    id: string;
    companyName: string;
  } | null;
}

interface RecentActivity {
  id: string;
  type: string;
  subject: string | null;
  description: string | null;
  createdAt: string;
  customer: {
    id: string;
    companyName: string;
  } | null;
  userName: string;
}

interface PersonnelPerformance {
  id: string;
  name: string;
  email: string;
  quoteCount: number;
  wonCount: number;
  winRate: number;
  contactedCount: number;
}

interface CountryStat {
  country: string;
  quoteCount: number;
}

interface TransportModeStat {
  mode: string;
  quoteCount: number;
  wonCount: number;
  winRate: number;
}

interface LossReason {
  reason: string;
  count: number;
}

interface TeamMetrics {
  weeklyQuotes: number;
  monthlyQuotes: number;
  lastMonthQuotes: number;
  monthlyWon: number;
  teamWinRate: number;
  activeCustomers: number;
  highPotentialCustomers: number;
}

interface AdminData {
  teamMetrics: TeamMetrics;
  personnelPerformance: PersonnelPerformance[];
  originCountries: CountryStat[];
  destinationCountries: CountryStat[];
  transportModeStats: TransportModeStat[];
  lossReasonAnalysis: LossReason[];
}

interface DashboardData {
  user: UserMetrics;
  widgets: {
    upcomingFollowUps: FollowUp[];
    customersToCall: CustomerToCall[];
    pendingQuotes: PendingQuote[];
    recentActivities: RecentActivity[];
  };
  admin?: AdminData;
}

interface UseDashboardReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to fetch dashboard data");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
