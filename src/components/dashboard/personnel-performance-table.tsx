'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users } from 'lucide-react';
import type { PersonnelPerformance } from '@/types';

interface PersonnelPerformanceTableProps {
  data: PersonnelPerformance[];
  loading: boolean;
}

export function PersonnelPerformanceTable({ data, loading }: PersonnelPerformanceTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Personel Performansı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Personel Performansı
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Temsilci</TableHead>
                <TableHead className="text-right">Teklif</TableHead>
                <TableHead className="text-right">Kazanma</TableHead>
                <TableHead className="text-right">Kaybetme</TableHead>
                <TableHead className="text-right">Oran</TableHead>
                <TableHead className="text-right">Gelir</TableHead>
                <TableHead className="text-right">Ort. Değer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Bu dönem için veri bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                data.map((person, index) => (
                  <TableRow key={person.userId}>
                    <TableCell className="text-center">
                      {index === 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          1
                        </span>
                      ) : index === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                          2
                        </span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                          3
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{person.userName}</TableCell>
                    <TableCell className="text-right">{person.totalQuotes}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      {person.wonQuotes}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {person.lostQuotes}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className={person.winRate >= 50 ? 'text-emerald-600 font-medium' : 'text-gray-600'}>
                          %{person.winRate.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(person.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatCurrency(person.avgQuoteValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
