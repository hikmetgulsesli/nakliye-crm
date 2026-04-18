import { useEffect, useState } from 'react';
import { Card, Skeleton } from '@/components/ui';
import api from '@/config/api';

interface Data {
  month: string;
  wonCount: number;
  totalRevenueTRY: number;
  totalCommissionTRY: number;
}

function formatTRY(n: number): string {
  return n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
}

export function CommissionCard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Data>('/commission/me')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Card title="💰 Bu Ay Komisyonum">
        <Skeleton variant="text" />
      </Card>
    );

  if (!data)
    return (
      <Card title="💰 Bu Ay Komisyonum">
        <p className="text-sm text-slate-500">Komisyon kuralı yapılandırılmamış.</p>
      </Card>
    );

  return (
    <Card title={`💰 Bu Ay Komisyonum (${data.month})`}>
      <div className="text-center py-2">
        <div className="text-4xl font-bold text-emerald-600">
          {formatTRY(data.totalCommissionTRY)}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {data.wonCount} kazanılan teklif · Toplam ciro {formatTRY(data.totalRevenueTRY)}
        </div>
      </div>
    </Card>
  );
}
