import Link from 'next/link';

export default function QuotationsPage() {
  const quotations = [
    {
      id: 'TKF-2026-0123',
      customer: 'Global Shipping Co.',
      route: 'Shanghai → İstanbul',
      mode: 'Sea',
      service: 'FCL',
      price: '$2,450',
      currency: 'USD',
      status: 'pending',
      date: '2026-03-15',
      validUntil: '2026-04-15',
    },
    {
      id: 'TKF-2026-0122',
      customer: 'ABC Logistics Ltd.',
      route: 'Hamburg → İzmir',
      mode: 'Sea',
      service: 'LCL',
      price: '€1,850',
      currency: 'EUR',
      status: 'won',
      date: '2026-03-14',
      validUntil: '2026-04-14',
    },
    {
      id: 'TKF-2026-0121',
      customer: 'Fast Freight Ltd.',
      route: 'Amsterdam → İstanbul',
      mode: 'Air',
      service: 'Air Freight',
      price: '$4,200',
      currency: 'USD',
      status: 'lost',
      date: '2026-03-12',
      validUntil: '2026-04-12',
    },
    {
      id: 'TKF-2026-0120',
      customer: 'Marine Transport Inc.',
      route: 'Rotterdam → Mersin',
      mode: 'Sea',
      service: 'Ro-Ro',
      price: '$3,100',
      currency: 'USD',
      status: 'pending',
      date: '2026-03-10',
      validUntil: '2026-04-10',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
            Won
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
            Lost
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Pending
          </span>
        );
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Sea':
        return <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">directions_boat</span>;
      case 'Air':
        return <span className="material-symbols-outlined text-sky-600 dark:text-sky-400">flight</span>;
      case 'Land':
        return <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">local_shipping</span>;
      default:
        return <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">local_shipping</span>;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Quotation List
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage shipping quotations and track their status.
            </p>
          </div>
          <Link
            href="/quotations/new"
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Quotation
          </Link>
        </header>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search quotes, customers..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary/50 dark:text-white">
                <option>All Status</option>
                <option>Pending</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
              <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary/50 dark:text-white">
                <option>All Modes</option>
                <option>Sea</option>
                <option>Air</option>
                <option>Land</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="px-6 py-4">Quote No</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Valid Until</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {quotations.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link 
                        href={`/quotations/${quote.id}`}
                        className="font-medium text-primary hover:text-primary/80"
                      >
                        {quote.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">{quote.customer}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 dark:text-slate-300">{quote.route.split(' → ')[0]}</span>
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">arrow_forward</span>
                        <span className="text-slate-700 dark:text-slate-300">{quote.route.split(' → ')[1]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getModeIcon(quote.mode)}
                        <span className="text-slate-600 dark:text-slate-400">{quote.service}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900 dark:text-white">{quote.price}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{quote.currency}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(quote.status)}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{quote.validUntil}</td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/quotations/${quote.id}`}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div>Showing 4 of 156 quotations</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
