'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminMetricsCards } from '@/components/dashboard/admin-metrics-cards';
import { DateRangeFilter } from '@/components/dashboard/date-range-filter';
import { PersonnelPerformanceTable } from '@/components/dashboard/personnel-performance-table';
import { CountryVolumeCharts } from '@/components/dashboard/country-volume-charts';
import { TransportModeChart } from '@/components/dashboard/transport-mode-chart';
import { LossReasonChart } from '@/components/dashboard/loss-reason-chart';
import type { AdminDashboardData } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!startDate || !endDate) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/dashboard/admin?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      
      if (response.status === 403) {
        router.push('/dashboard');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Dashboard verileri yüklenirken hata oluştu');
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, router]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, startDate, endDate]);

  const handleDateChange = useCallback((newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  }, []);

  const handleExportPDF = useCallback(async () => {
    try {
      setExporting(true);
      
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'admin-dashboard',
          startDate,
          endDate,
          data: {
            metrics: data?.metrics,
            personnelPerformance: data?.personnelPerformance,
            originCountries: data?.originCountries,
            destinationCountries: data?.destinationCountries,
            modeDistribution: data?.modeDistribution,
            lossReasons: data?.lossReasons,
          },
        }),
      });

      if (!response.ok) {
        // If export API doesn't exist or fails, use browser print to PDF
        window.print();
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-dashboard-${startDate}-${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback to browser print
      window.print();
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, data]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2 text-red-600">
            <span>{error}</span>
          </div>
          <Button
            onClick={fetchDashboardData}
            className="mt-4"
            variant="outline"
          >
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={contentRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Ekip performansı ve genel metrikler
          </p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={exporting || loading}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          PDF Export
        </Button>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        onExportPDF={handleExportPDF}
        loading={loading}
      />

      {/* Overview Metrics */}
      <AdminMetricsCards 
        metrics={data?.metrics || null} 
        loading={loading} 
      />

      {/* Personnel Performance Table */}
      <PersonnelPerformanceTable
        data={data?.personnelPerformance || []}
        loading={loading}
      />

      {/* Country Volume Charts */}
      <CountryVolumeCharts
        originCountries={data?.originCountries || []}
        destinationCountries={data?.destinationCountries || []}
        loading={loading}
      />

      {/* Transport Mode and Loss Reason Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TransportModeChart
          data={data?.modeDistribution || []}
          loading={loading}
        />
        <LossReasonChart
          data={data?.lossReasons || []}
          loading={loading}
        />
      </div>
    </div>
  );
}
