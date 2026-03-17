import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'ADMIN';

  // Mock metrics data - in production this would come from API
  const metrics = {
    weeklyQuotes: 12,
    monthlyQuotes: 45,
    monthlyWon: 23,
    winRate: 51,
    contactedCustomers: 32,
    pendingFollowUps: 5,
    customersToCall: 8,
    pendingQuotes: 14,
  };

  const recentActivities = [
    { id: 1, type: 'call', customer: 'ABC Logistics', user: 'Ahmet Yılmaz', date: '2 hours ago', outcome: 'Teklif İstendi' },
    { id: 2, type: 'email', customer: 'Global Shipping Co.', user: 'Mehmet Kaya', date: '4 hours ago', outcome: 'Olumlu' },
    { id: 3, type: 'quote', customer: 'Fast Freight Ltd.', user: 'Elif Demir', date: '6 hours ago', outcome: 'Kazanıldı' },
    { id: 4, type: 'meeting', customer: 'Marine Transport Inc.', user: 'Ahmet Yılmaz', date: 'Yesterday', outcome: 'Nötr' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, {session.user.name}! Here&apos;s what&apos;s happening today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/customers/new"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Customer
            </Link>
            <Link
              href="/quotations/new"
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              New Quotation
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Weekly Quotes</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.weeklyQuotes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">description</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Quotes</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.monthlyQuotes}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">request_quote</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Win Rate</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.winRate}%</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{metrics.monthlyWon} won this month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">trending_up</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contacted</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{metrics.contactedCustomers}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This month</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl">groups</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Follow-ups */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_upcoming</span>
                Upcoming Follow-ups
              </h3>
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                {metrics.pendingFollowUps} pending
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">ABC Logistics</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Follow-up call</p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Today</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Marine Transport</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Price negotiation</p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Tomorrow</span>
              </div>
            </div>
            <Link 
              href="/activities" 
              className="mt-4 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {/* Customers to Call */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">phone_missed</span>
                Need Attention
              </h3>
              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium px-2 py-1 rounded-full">
                {metrics.customersToCall} customers
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Fast Freight Ltd.</p>
                  <p className="text-xs text-red-500 dark:text-red-400">14 days no contact</p>
                </div>
                <Link 
                  href="/customers"
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Call
                </Link>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Ocean Cargo Co.</p>
                  <p className="text-xs text-red-500 dark:text-red-400">12 days no contact</p>
                </div>
                <Link 
                  href="/customers"
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Call
                </Link>
              </div>
            </div>
            <Link 
              href="/customers" 
              className="mt-4 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {/* Pending Quotes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">pending</span>
                Pending Quotes
              </h3>
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium px-2 py-1 rounded-full">
                {metrics.pendingQuotes} waiting
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">TKF-2026-0123</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Global Shipping Co.</p>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400">7 days</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">TKF-2026-0121</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ABC Logistics</p>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400">9 days</span>
              </div>
            </div>
            <Link 
              href="/quotations" 
              className="mt-4 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activities</h3>
            <Link 
              href="/activities" 
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Outcome</th>
                  <th className="pb-3 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="text-sm">
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">
                          {activity.type === 'call' ? 'call' : activity.type === 'email' ? 'mail' : activity.type === 'meeting' ? 'event' : 'description'}
                        </span>
                        <span className="capitalize text-slate-700 dark:text-slate-300">{activity.type}</span>
                      </span>
                    </td>
                    <td className="py-3 text-slate-900 dark:text-white font-medium">{activity.customer}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{activity.user}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        activity.outcome === 'Kazanıldı' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : activity.outcome === 'Teklif İstendi'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : activity.outcome === 'Olumlu'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {activity.outcome}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-500 dark:text-slate-400 text-xs">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Admin Quick Access</h3>
                <p className="text-sm text-slate-400 mt-1">Manage users, metadata, and system settings</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/admin/users"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  Users
                </Link>
                <Link
                  href="/admin/metadata"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">list_alt</span>
                  Metadata
                </Link>
                <Link
                  href="/reports"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                  Reports
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
