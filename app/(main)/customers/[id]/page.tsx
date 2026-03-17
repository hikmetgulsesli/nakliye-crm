import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Mock customer data - in production this would come from API
  const customer = {
    id,
    companyName: 'ABC Logistics Ltd.',
    contactName: 'Mehmet Yılmaz',
    email: 'mehmet@abclogistics.com',
    phone: '+90 532 123 4567',
    address: 'Atatürk Cad. No:123, İstanbul, Turkey',
    transportModes: ['Sea', 'Air'],
    serviceTypes: ['FCL', 'LCL'],
    incoterms: ['FOB', 'CIF'],
    direction: { import: true, export: true },
    originCountries: ['China', 'Germany'],
    destinationCountries: ['Turkey', 'UK'],
    source: 'Referral',
    potential: 'High',
    status: 'Active',
    assignedTo: 'Ahmet Yılmaz',
    lastContactDate: '2026-03-15',
    lastQuoteDate: '2026-03-10',
    notes: 'Key customer for East Asia routes. Prefers FCL shipments.',
  };

  const quotations = [
    { id: 'TKF-2026-0115', date: '2026-03-10', status: 'Won', price: '$2,450' },
    { id: 'TKF-2026-0098', date: '2026-02-28', status: 'Won', price: '$3,100' },
    { id: 'TKF-2026-0056', date: '2026-02-15', status: 'Lost', price: '$1,850' },
  ];

  const activities = [
    { id: 1, type: 'call', date: '2026-03-15', outcome: 'Olumlu', notes: 'Discussed new shipment requirements' },
    { id: 2, type: 'email', date: '2026-03-12', outcome: 'Teklif İstendi', notes: 'Requested quote for Shanghai route' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/customers" className="hover:text-primary transition-colors">Customers</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">{customer.companyName}</span>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/customers/${id}/edit`}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </Link>
            <Link
              href="/quotations/new"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Quotation
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{customer.companyName}</h1>
                  <p className="text-slate-500 dark:text-slate-400">{customer.contactName}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  customer.status === 'Active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {customer.status}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {customer.transportModes.map((mode) => (
                  <span key={mode} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {mode}
                  </span>
                ))}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                  customer.potential === 'High'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {customer.potential} Potential
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">mail</span>
                  <a href={`mailto:${customer.email}`} className="text-sm text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">call</span>
                  <a href={`tel:${customer.phone}`} className="text-sm text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">
                    {customer.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <span className="material-symbols-outlined text-slate-400">location_on</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{customer.address}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="flex">
                  <button className="px-6 py-3 text-sm font-medium text-primary border-b-2 border-primary">
                    Quotations
                  </button>
                  <button className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                    Activities
                  </button>
                  <button className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                    History
                  </button>
                </nav>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {quotations.map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <Link href={`/quotations/${quote.id}`} className="font-medium text-primary hover:text-primary/80">
                          {quote.id}
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{quote.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          quote.status === 'Won'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {quote.status}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">{quote.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/quotations" className="mt-4 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                  View all quotations <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Source</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{customer.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Assigned To</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{customer.assignedTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Last Contact</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{customer.lastContactDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Last Quote</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{customer.lastQuoteDate}</span>
                </div>
              </div>
            </div>

            {/* Shipping Preferences */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Shipping Preferences</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Origin</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.originCountries.map((country) => (
                      <span key={country} className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Destination</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.destinationCountries.map((country) => (
                      <span key={country} className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Incoterms</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.incoterms.map((term) => (
                      <span key={term} className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-slate-500 text-[16px]">
                        {activity.type === 'call' ? 'call' : 'mail'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white">{activity.outcome}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{activity.date}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{activity.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/activities" className="mt-4 text-sm text-primary hover:text-primary/80 font-medium">
                View all activity
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
