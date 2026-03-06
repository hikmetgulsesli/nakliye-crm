'use client';

import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { PeriodReport } from './PeriodReport.js';
import { PerformanceReport } from './PerformanceReport.js';
import { WonLostReport } from './WonLostReport.js';
import { CountryVolumeReport } from './CountryVolumeReport.js';
import { SavedReports } from './SavedReports.js';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('period');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground">
            Detaylı performans ve analiz raporları
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          Yenile
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="period">Dönem Raporu</TabsTrigger>
          <TabsTrigger value="performance">Performans</TabsTrigger>
          <TabsTrigger value="won-lost">Kazanma/Kaybetme</TabsTrigger>
          <TabsTrigger value="country">Ülke/Mod</TabsTrigger>
          <TabsTrigger value="saved">Kayıtlı</TabsTrigger>
        </TabsList>

        <TabsContent value="period" className="space-y-4">
          <PeriodReport key={`period-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceReport key={`performance-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="won-lost" className="space-y-4">
          <WonLostReport key={`won-lost-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="country" className="space-y-4">
          <CountryVolumeReport key={`country-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <SavedReports onLoadReport={(type) => setActiveTab(type)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { ReportsPage };
