import { useState } from 'react';
import { Tabs } from '@/components/ui';
import { CustomerGeneralTab } from './CustomerGeneralTab';
import { CustomerQuotesTab } from './CustomerQuotesTab';
import { CustomerActivitiesTab } from './CustomerActivitiesTab';
import { CustomerHistoryTab } from './CustomerHistoryTab';
import type { Customer } from '@nakliye-crm/shared';

interface CustomerDetailTabsProps {
  customer: Customer;
}

const TABS = [
  { key: 'general', label: 'Genel Bilgiler' },
  { key: 'quotes', label: 'Teklifler' },
  { key: 'activities', label: 'Aktiviteler' },
  { key: 'history', label: 'Gecmis' },
];

export function CustomerDetailTabs({ customer }: CustomerDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div>
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'general' && <CustomerGeneralTab customer={customer} />}
        {activeTab === 'quotes' && <CustomerQuotesTab customerId={customer.id} />}
        {activeTab === 'activities' && (
          <CustomerActivitiesTab customerId={customer.id} />
        )}
        {activeTab === 'history' && <CustomerHistoryTab customerId={customer.id} />}
      </div>
    </div>
  );
}
