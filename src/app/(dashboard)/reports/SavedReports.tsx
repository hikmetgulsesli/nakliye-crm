'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SavedReportsProps {
  onLoadReport?: (type: string) => void;
}

<<<<<<< HEAD
export function SavedReports({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLoadReport,
}: SavedReportsProps) {
=======
export function SavedReports({ onLoadReport }: SavedReportsProps) {
>>>>>>> origin/feature/crm-core-modules
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
