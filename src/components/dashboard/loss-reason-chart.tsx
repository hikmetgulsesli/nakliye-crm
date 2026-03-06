'use client';

import type { LossReasonAnalysis } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface LossReasonChartProps {
  data: LossReasonAnalysis[];
  className?: string;
}

export function LossReasonChart({ data, className }: LossReasonChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl border border-slate-200 p-6 shadow-sm', className)}>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Kaybedilme Nedenleri</h3>
        <p className="text-sm text-slate-500 mb-6">Kaybedilen tekliflerin neden analizi</p>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-400">Bu dönemde kaybedilen teklif bulunmuyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-6 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Kaybedilme Nedenleri</h3>
      <p className="text-sm text-slate-500 mb-6">Kaybedilen tekliflerin neden analizi</p>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="reason" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, _name, props) => {
                const percentage = (props?.payload as { percentage?: number })?.percentage ?? 0;
                return [`${value ?? 0} teklif (${percentage}%)`, 'Sayı'];
              }}
            />
            <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
