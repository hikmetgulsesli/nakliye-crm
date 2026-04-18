import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface PortalCustomer {
  id: number;
  companyName: string;
  contactName: string | null;
  email: string;
  phone: string;
}

interface PortalQuote {
  id: number;
  quoteNo: string;
  quoteDate: string;
  validityDate: string;
  transportMode: string | null;
  originCountry: string | null;
  destinationCountry: string | null;
  price: number | null;
  currency: string | null;
  status: string;
}

interface PortalShipment {
  id: number;
  shipmentNo: string;
  blNumber: string | null;
  originCountry: string | null;
  destinationCountry: string | null;
  etd: string | null;
  eta: string | null;
  status: string;
}

export default function PortalDashboardPage() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<PortalCustomer | null>(null);
  const [quotes, setQuotes] = useState<PortalQuote[]>([]);
  const [shipments, setShipments] = useState<PortalShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      navigate('/portal/giris');
      return;
    }
    const config = { headers: { Authorization: `Bearer ${token}` } };
    Promise.all([
      axios.get('/api/portal/me', config),
      axios.get('/api/portal/quotations', config),
      axios.get('/api/portal/shipments', config),
    ])
      .then(([c, q, s]) => {
        setCustomer(c.data.data);
        setQuotes(q.data.data);
        setShipments(s.data.data);
      })
      .catch(() => {
        localStorage.removeItem('portal_token');
        navigate('/portal/giris');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  function logout() {
    localStorage.removeItem('portal_token');
    navigate('/portal/giris');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#e30a17] flex items-center justify-center">
              <span className="material-symbols-outlined text-white">business</span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {customer?.companyName}
              </div>
              <div className="text-xs text-slate-500">{customer?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Quotes */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Tekliflerim ({quotes.length})
          </h2>
          {quotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center text-slate-500">
              Henüz teklif yok.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Güzergah</th>
                    <th className="px-4 py-3">Fiyat</th>
                    <th className="px-4 py-3">Geçerlilik</th>
                    <th className="px-4 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {quotes.map((q) => (
                    <tr key={q.id}>
                      <td className="px-4 py-3 font-medium">{q.quoteNo}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {q.originCountry} → {q.destinationCountry}
                      </td>
                      <td className="px-4 py-3">
                        {q.price ? `${q.price} ${q.currency}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(q.validityDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3">{q.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Shipments */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Sevkiyatlarım ({shipments.length})
          </h2>
          {shipments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center text-slate-500">
              Henüz sevkiyat yok.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-left text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">BL</th>
                    <th className="px-4 py-3">Güzergah</th>
                    <th className="px-4 py-3">ETA</th>
                    <th className="px-4 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {shipments.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium">{s.shipmentNo}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.blNumber || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {s.originCountry} → {s.destinationCountry}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {s.eta ? new Date(s.eta).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td className="px-4 py-3">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
