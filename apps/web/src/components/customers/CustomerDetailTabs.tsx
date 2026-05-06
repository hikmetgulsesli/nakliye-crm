import { useEffect, useState } from 'react';
import { Tabs } from '@/components/ui';
import { CustomerGeneralTab } from './CustomerGeneralTab';
import { CustomerQuotesTab } from './CustomerQuotesTab';
import { CustomerShipmentsTab } from './CustomerShipmentsTab';
import { CustomerActivitiesTab } from './CustomerActivitiesTab';
import { CustomerHistoryTab } from './CustomerHistoryTab';
import api from '@/config/api';
import { shipmentService } from '@/services/shipment.service';
import type { Customer, PaginatedResponse, Quotation } from '@nakliye-crm/shared';

interface CustomerDetailTabsProps {
  customer: Customer;
}

export function CustomerDetailTabs({ customer }: CustomerDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [quoteCount, setQuoteCount] = useState<number | null>(null);
  const [shipmentCount, setShipmentCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      try {
        const [quoteRes, shipmentRes] = await Promise.all([
          api.get<PaginatedResponse<Quotation>>('/quotations', {
            params: { customerId: customer.id, pageSize: 1 },
          }),
          shipmentService.list(1, 1, { customerId: customer.id }),
        ]);
        if (cancelled) return;
        setQuoteCount(quoteRes.data.total);
        setShipmentCount(shipmentRes.total);
      } catch {
        if (cancelled) return;
        setQuoteCount(null);
        setShipmentCount(null);
      }
    }
    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, [customer.id]);

  const tabs = [
    { key: 'general', label: 'Genel Bilgiler', icon: 'info' },
    { key: 'quotes', label: 'Teklifler', icon: 'request_quote', badge: quoteCount },
    { key: 'shipments', label: 'Sevkiyatlar', icon: 'local_shipping', badge: shipmentCount },
    { key: 'activities', label: 'Aktiviteler', icon: 'event' },
    { key: 'history', label: 'Geçmiş', icon: 'history' },
  ];

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'general' && <CustomerGeneralTab customer={customer} />}
        {activeTab === 'quotes' && <CustomerQuotesTab customerId={customer.id} />}
        {activeTab === 'shipments' && <CustomerShipmentsTab customerId={customer.id} />}
        {activeTab === 'activities' && (
          <CustomerActivitiesTab customerId={customer.id} />
        )}
        {activeTab === 'history' && <CustomerHistoryTab customerId={customer.id} />}
      </div>
    </div>
  );
}
