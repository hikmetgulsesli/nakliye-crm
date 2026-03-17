import Link from 'next/link';

export default function ActivitiesPage() {
  const activities = [
    {
      id: 1,
      type: 'call',
      customer: 'ABC Logistics Ltd.',
      user: 'Ahmet Yılmaz',
      date: '2026-03-17',
      time: '14:30',
      duration: 25,
      outcome: 'Teklif İstendi',
      notes: 'Customer requested quotation for FCL shipment from Shanghai to İstanbul.',
      nextAction: '2026-03-18',
    },
    {
      id: 2,
      type: 'email',
      customer: 'Global Shipping Co.',
      user: 'Mehmet Kaya',
      date: '2026-03-17',
      time: '11:15',
      duration: 0,
      outcome: 'Olumlu',
      notes: 'Sent follow-up email regarding previous quotation. Customer responded positively.',
      nextAction: '2026-03-20',
    },
    {
      id: 3,
      type: 'meeting',
      customer: 'Marine Transport Inc.',
      user: 'Elif Demir',
      date: '2026-03-16',
      time: '10:00',
      duration: 60,
      outcome: 'Nötr',
      notes: 'Face-to-face meeting at customer office. Discussed potential partnership.',
      nextAction: '2026-03-23',
    },
    {
      id: 4,
      type: 'call',
      customer: 'Fast Freight Ltd.',
      user: 'Ahmet Yılmaz',
      date: '2026-03-15',
      time: '16:45',
      duration: 15,
      outcome: 'Olumsuz',
      notes: 'Customer decided to go with competitor due to price.',
      nextAction: null,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">call</span>;
      case 'email':
        return <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">mail</span>;
      case 'meeting':
        return <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">event</span>;
      case 'video':
        return <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">videocam</span>;
      default:
        return <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">event_note</span>;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Olumlu':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Olumlu
          </span>
        );
      case 'Teklif İstendi':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Teklif İstendi
          </span>
        );
      case 'Olumsuz':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Olumsuz
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Nötr
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Activities
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track customer interactions and communication history.
            </p>
          </div>
          <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">add</span>
            Log Activity
          </button>
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
                placeholder="Search activities, customers..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary/50 dark:text-white">
                <option>All Types</option>
                <option>Call</option>
                <option>Email</option>
                <option>Meeting</option>
                <option>Video</option>
              </select>
              <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary/50 dark:text-white">
                <option>All Outcomes</option>
                <option>Olumlu</option>
                <option>Nötr</option>
                <option>Olumsuz</option>
                <option>Teklif İstendi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {activities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Icon & Type */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="lg:hidden">
                      <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{activity.type}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{activity.date} {activity.time}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <Link 
                        href={`/customers/1`}
                        className="text-lg font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors"
                      >
                        {activity.customer}
                      </Link>
                      <span className="hidden lg:inline text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        by {activity.user}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                      {activity.notes}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {getOutcomeBadge(activity.outcome)}
                      {activity.duration > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          {activity.duration} min
                        </span>
                      )}
                      {activity.nextAction && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">event_upcoming</span>
                          Next: {activity.nextAction}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date & Actions */}
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.date}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div>Showing 4 of 48 activities</div>
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
