'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  onExportPDF?: () => void;
  loading?: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onDateChange,
  onExportPDF,
  loading = false,
}: DateRangeFilterProps) {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  const handleApply = () => {
    onDateChange(localStart, localEnd);
  };

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];

    setLocalStart(startStr);
    setLocalEnd(endStr);
    onDateChange(startStr, endStr);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        {/* Date Inputs */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
              Başlangıç Tarihi
            </Label>
            <div className="relative mt-1">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="start-date"
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1">
            <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
              Bitiş Tarihi
            </Label>
            <div className="relative mt-1">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="end-date"
                type="date"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreset(7)}
            disabled={loading}
          >
            Son 7 Gün
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreset(30)}
            disabled={loading}
          >
            Son 30 Gün
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreset(90)}
            disabled={loading}
          >
            Son 90 Gün
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleApply}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Uygula
          </Button>
          {onExportPDF && (
            <Button
              variant="outline"
              onClick={onExportPDF}
              disabled={loading}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
