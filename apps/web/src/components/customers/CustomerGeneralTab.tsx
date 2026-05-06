import { Card, Icon } from '@/components/ui';
import type { Customer } from '@nakliye-crm/shared';
import { splitMultiValue, formatTrPhone } from '@nakliye-crm/shared';

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
      {/* İletişim Bilgileri */}
      <Card title="İletişim Bilgileri">
        <div className="space-y-4">
          <InfoRow icon="person" label="Yetkili Kişi" value={customer.contactName} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon="badge" label="Vergi No / TCKN" value={customer.taxNumber} />
            <InfoRow icon="account_balance" label="Vergi Dairesi" value={customer.taxOffice} />
          </div>
          <MultiInfoRow
            icon="phone"
            label="Telefon"
            value={customer.phone}
            formatter={formatTrPhone}
          />
          <MultiInfoRow icon="mail" label="E-posta" value={customer.email} />
          <InfoRow icon="location_on" label="Adres" value={customer.address} />
        </div>
      </Card>

      {/* Nakliye Tercihleri */}
      <Card title="Nakliye Tercihleri">
        <div className="space-y-4">
          {/* Transport Modes */}
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Taşıma Modlari</p>
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
                <span className="text-sm text-slate-400 dark:text-slate-500">Belirtilmemiş</span>
              )}
            </div>
          </div>

          {/* Service Types */}
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Servis Tipleri</p>
            <div className="flex flex-wrap gap-2">
              {customer.serviceTypes && customer.serviceTypes.length > 0 ? (
                customer.serviceTypes.map((type) => (
                  <span
                    key={type}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full px-3 py-1 text-sm font-medium"
                  >
                    {type}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400 dark:text-slate-500">Belirtilmemiş</span>
              )}
            </div>
          </div>

          {/* Incoterms */}
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Incoterms</p>
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
                <span className="text-sm text-slate-400 dark:text-slate-500">Belirtilmemiş</span>
              )}
            </div>
          </div>

          {/* Direction */}
          {customer.direction && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Yon</p>
              <span className="text-sm text-slate-700 dark:text-slate-300">{customer.direction}</span>
            </div>
          )}
        </div>
      </Card>

      {/* İlgilendiği Ülkeler — eski origin/destination listelerinin birlesimi
          (yeni kayitlarda zaten ikisi ayni; eski kayitlar icin de dedupe). */}
      {(() => {
        const interest = Array.from(
          new Set([
            ...(customer.originCountries ?? []),
            ...(customer.destinationCountries ?? []),
          ]),
        );
        return (
          <Card title="İlgilendiği Ülkeler">
            <div className="flex flex-wrap gap-2">
              {interest.length > 0 ? (
                interest.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-sm font-medium"
                  >
                    <Icon name="public" size="sm" />
                    {country}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400 dark:text-slate-500">
                  Belirtilmemiş
                </span>
              )}
            </div>
          </Card>
        );
      })()}

      {/* CRM Bilgileri */}
      <Card title="CRM Bilgileri">
        <div className="space-y-4">
          <InfoRow icon="source" label="Müşteri Kaynagi" value={customer.source} />
          <InfoRow icon="trending_up" label="Potansiyel" value={customer.potential} />
          {customer.notes && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Notlar</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                {customer.notes}
              </p>
            </div>
          )}
          <InfoRow
            icon="person"
            label="Oluşturan"
            value={customer.createdBy?.fullName}
          />
          <InfoRow
            icon="event"
            label="Oluşturma Tarihi"
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
      <div className="flex items-center justify-center size-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">
        <Icon name={icon} size="sm" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {value || <span className="text-slate-400 dark:text-slate-500">Belirtilmemiş</span>}
        </p>
      </div>
    </div>
  );
}

function MultiInfoRow({
  icon,
  label,
  value,
  formatter,
}: {
  icon: string;
  label: string;
  value?: string | null;
  formatter?: (v: string) => string;
}) {
  const parts = value
    ? splitMultiValue(value).map((p) => (formatter ? formatter(p) || p : p))
    : [];
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center size-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">
        <Icon name={icon} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        {parts.length === 0 ? (
          <p className="text-sm font-medium">
            <span className="text-slate-400 dark:text-slate-500">Belirtilmemiş</span>
          </p>
        ) : (
          <ul className="space-y-0.5">
            {parts.map((part, idx) => (
              <li
                key={`${part}-${idx}`}
                className="text-sm font-medium text-slate-900 dark:text-slate-100 break-all"
              >
                {part}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
