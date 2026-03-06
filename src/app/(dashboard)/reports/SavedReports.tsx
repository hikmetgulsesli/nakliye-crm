'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SavedReportsProps {
  onLoadReport?: (type: string) => void;
}

export function SavedReports({ onLoadReport }: SavedReportsProps) {
  void onLoadReport; // Reserved for future use
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kayıtlı Raporlar</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Henüz kayıtlı rapor bulunmuyor.</p>
      </CardContent>
    </Card>
  );
}
