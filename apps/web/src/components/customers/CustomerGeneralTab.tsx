import { Card, Icon } from '@/components/ui';
import type { Customer } from '@nakliye-crm/shared';

interface CustomerGeneralTabProps {
  customer: Customer;
}

const TRANSPORT_MODE_ICONS: Record<string, string> = {
  Deniz: 'directions_boat',
  Hava: 'flight',
  Kara: 'local_shipping',
  Kombine: 'hub',
};

export function CustomerGeneralTab({ customer }: CustomerGeneralTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Iletisim Bilgileri */}
      <Card title="Iletisim Bilgileri">
        <div className="space-y-4">
          <InfoRow icon="person" label="Yetkili Kisi" value={customer.contactName} />
          <InfoRow icon="phone" label="Telefon" value={customer.phone} />
          <InfoRow icon="mail" label="E-posta" value={customer.email} />
          <InfoRow icon="location_on" label="Adres" value={customer.address} />
        </div>
      </Card>

      {/* Nakliye Tercihleri */}
      <Card title="Nakliye Tercihleri">
        <div className="space-y-4">
          {/* Transport Modes */}
          <div>
            <p className="text-sm text-slate-500 mb-2">Tasima Modlari</p>
            <div className="flex flex-wrap gap-2">
              {customer.transportModes && customer.transportModes.length > 0 ? (
                customer.transportModes.map((mode) => (
                  <span
                    key={mode}
                    className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-sm font-medium"
                  >
                    <Icon
                      name={TRANSPORT_MODE_ICONS[mode] || 'local_shipping'}
                      size="sm"
                    />
                    {mode}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">Belirtilmemis</span>
              )}
            </div>
          </div>

          {/* Service Types */}
          <div>
            <p className="text-sm text-slate-500 mb-2">Servis Tipleri</p>
            <div className="flex flex-wrap gap-2">
              {customer.serviceTypes && customer.serviceTypes.length > 0 ? (
                customer.serviceTypes.map((type) => (
                  <span
                    key={type}
                    className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-sm font-medium"
                  >
                    {type}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">Belirtilmemis</span>
              )}
            </div>
          </div>

          {/* Incoterms */}
          <div>
            <p className="text-sm text-slate-500 mb-2">Incoterms</p>
            <div className="flex flex-wrap gap-2">
              {customer.incoterms && customer.incoterms.length > 0 ? (
                customer.incoterms.map((term) => (
                  <span
                    key={term}
                    className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm font-medium"
                  >
                    {term}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">Belirtilmemis</span>
              )}
            </div>
          </div>

          {/* Direction */}
          {customer.direction && (
            <div>
              <p className="text-sm text-slate-500 mb-2">Yon</p>
              <span className="text-sm text-slate-700">{customer.direction}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Sik Kullanilan Hatlar */}
      <Card title="Sik Kullanilan Hatlar">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-2">Cikis Ulkeleri</p>
            <div className="flex flex-wrap gap-2">
              {customer.originCountries && customer.originCountries.length > 0 ? (
                customer.originCountries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-lg px-3 py-1.5 text-sm font-medium"
                  >
                    <Icon name="flight_takeoff" size="sm" />
                    {country}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">Belirtilmemis</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500 mb-2">Varis Ulkeleri</p>
            <div className="flex flex-wrap gap-2">
              {customer.destinationCountries &&
              customer.destinationCountries.length > 0 ? (
                customer.destinationCountries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 rounded-lg px-3 py-1.5 text-sm font-medium"
                  >
                    <Icon name="flight_land" size="sm" />
                    {country}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">Belirtilmemis</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* CRM Bilgileri */}
      <Card title="CRM Bilgileri">
        <div className="space-y-4">
          <InfoRow icon="source" label="Musteri Kaynagi" value={customer.source} />
          <InfoRow icon="trending_up" label="Potansiyel" value={customer.potential} />
          {customer.notes && (
            <div>
              <p className="text-sm text-slate-500 mb-1">Notlar</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">
                {customer.notes}
              </p>
            </div>
          )}
          <InfoRow
            icon="person"
            label="Olusturan"
            value={customer.createdBy?.fullName}
          />
          <InfoRow
            icon="event"
            label="Olusturma Tarihi"
            value={
              customer.createdAt
                ? new Date(customer.createdAt).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : undefined
            }
          />
        </div>
      </Card>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center size-9 rounded-lg bg-slate-100 text-slate-500 flex-shrink-0 mt-0.5">
        <Icon name={icon} size="sm" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">
          {value || <span className="text-slate-400">Belirtilmemis</span>}
        </p>
      </div>
    </div>
  );
}
