'use client';

import Link from 'next/link';
import { 
  FileText,
  Phone,
  UserPlus
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    label: 'Müşteri Ekle',
    href: '/customers/new',
    icon: <UserPlus className="w-5 h-5" />,
    color: 'bg-blue-600 hover:bg-blue-700',
    description: 'Yeni müşteri kartı oluştur',
  },
  {
    label: 'Teklif Oluştur',
    href: '/quotations/new',
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-indigo-600 hover:bg-indigo-700',
    description: 'Yeni fiyat teklifi hazırla',
  },
  {
    label: 'Aktivite Kaydet',
    href: '/activities/new',
    icon: <Phone className="w-5 h-5" />,
    color: 'bg-emerald-600 hover:bg-emerald-700',
    description: 'Görüşme notu ekle',
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`group flex items-center gap-3 rounded-lg ${action.color} text-white p-4 transition-all hover:shadow-md active:scale-[0.98]`}
          >
            <div className="p-2 bg-white/20 rounded-lg">
              {action.icon}
            </div>
            <div>
              <p className="font-medium">{action.label}</p>
              <p className="text-xs text-white/80">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}