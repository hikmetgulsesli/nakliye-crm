import Link from 'next/link';

export default function CustomersPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Customer List
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your customers and their shipping preferences.
            </p>
          </div>
          <Link
            href="/customers/new"
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Customer
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
                placeholder="Search by company, contact, or email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary/50 dark:text-white">
                <option>All Status</option>
                <option>Active</option>
                <option>Passive</option>
                <option>Cold</option>
              </select>
              <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary/50 dark:text-white">
                <option>All Potential</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
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
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Transport Mode</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assigned</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">ABC Logistics Ltd.</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">İstanbul, Turkey</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-900 dark:text-white">Mehmet Yılmaz</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">mehmet@abc.com</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Sea
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                        Air
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Ahmet Yılmaz</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href="/customers/1"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Global Shipping Co.</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">İzmir, Turkey</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-900 dark:text-white">Elif Demir</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">elif@global.com</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Sea
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Mehmet Kaya</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href="/customers/2"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Fast Freight Ltd.</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Mersin, Turkey</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-900 dark:text-white">Ali Şahin</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">ali@fast.com</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Sea
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Land
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Passive
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Elif Demir</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href="/customers/3"
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div>Showing 3 of 124 customers</div>
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
