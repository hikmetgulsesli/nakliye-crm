"use client";

import { TrendingUp, Users, FileText, Percent } from "lucide-react";
import { getTransportModeLabel } from "@/lib/utils/formatters";

interface PersonnelPerformance {
  id: string;
  name: string;
  email: string;
  quoteCount: number;
  wonCount: number;
  winRate: number;
  contactedCount: number;
}

interface PersonnelPerformanceTableProps {
  personnel: PersonnelPerformance[];
}

export function PersonnelPerformanceTable({ personnel }: PersonnelPerformanceTableProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Personel Performansı</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bu ay</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Temsilci
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Teklif
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Kazanılan
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Oran
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Görüşme
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {personnel.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Henüz veri yok
                </td>
              </tr>
            ) : (
              personnel.map((person) => (
                <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{person.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{person.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {person.quoteCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      {person.wonCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Percent className="w-4 h-4 text-slate-400" />
                      <span
                        className={`font-medium ${
                          person.winRate >= 50
                            ? "text-green-600"
                            : person.winRate >= 30
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        %{person.winRate}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      {person.contactedCount}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CountryStat {
  country: string;
  quoteCount: number;
}

interface CountryDistributionProps {
  originCountries: CountryStat[];
  destinationCountries: CountryStat[];
}

export function CountryDistribution({ originCountries, destinationCountries }: CountryDistributionProps) {
  const maxOriginCount = Math.max(...originCountries.map((c) => c.quoteCount), 1);
  const maxDestCount = Math.max(...destinationCountries.map((c) => c.quoteCount), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Origin Countries */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Çıkış Ülkeleri (Top 10)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Son 30 gün</p>
        </div>
        <div className="p-4 space-y-3">
          {originCountries.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-4">Henüz veri yok</p>
          ) : (
            originCountries.map((country) => (
              <div key={country.country} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-900 dark:text-white">{country.country}</span>
                  <span className="text-slate-500 dark:text-slate-400">{country.quoteCount}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(country.quoteCount / maxOriginCount) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Destination Countries */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Varış Ülkeleri (Top 10)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Son 30 gün</p>
        </div>
        <div className="p-4 space-y-3">
          {destinationCountries.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-4">Henüz veri yok</p>
          ) : (
            destinationCountries.map((country) => (
              <div key={country.country} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-900 dark:text-white">{country.country}</span>
                  <span className="text-slate-500 dark:text-slate-400">{country.quoteCount}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(country.quoteCount / maxDestCount) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface TransportModeStat {
  mode: string;
  quoteCount: number;
  wonCount: number;
  winRate: number;
}

interface TransportModeDistributionProps {
  stats: TransportModeStat[];
}

export function TransportModeDistribution({ stats }: TransportModeDistributionProps) {
  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      AIR: "bg-sky-500",
      SEA: "bg-blue-500",
      ROAD: "bg-green-500",
      RAIL: "bg-amber-500",
      MULTIMODAL: "bg-purple-500",
    };
    return colors[mode] || "bg-slate-500";
  };

  const maxCount = Math.max(...stats.map((s) => s.quoteCount), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white">Taşıma Modu Dağılımı</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bu ay</p>
      </div>
      <div className="p-4">
        {stats.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">Henüz veri yok</p>
        ) : (
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.mode} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-slate-900 dark:text-white">
                  {getTransportModeLabel(stat.mode)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{stat.quoteCount} teklif</span>
                    <span
                      className={`font-medium ${
                        stat.winRate >= 50
                          ? "text-green-600"
                          : stat.winRate >= 30
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      %{stat.winRate}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getModeColor(stat.mode)} rounded-full transition-all duration-500`}
                      style={{ width: `${(stat.quoteCount / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LossReason {
  reason: string;
  count: number;
}

interface LossReasonAnalysisProps {
  reasons: LossReason[];
}

export function LossReasonAnalysis({ reasons }: LossReasonAnalysisProps) {
  const total = reasons.reduce((sum, r) => sum + r.count, 0);
  const maxCount = Math.max(...reasons.map((r) => r.count), 1);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      Price: "Fiyat",
      Competitor: "Rakip",
      "Delayed Response": "Gecikmeli Dönüş",
      "No Budget": "Bütçe Yok",
      Other: "Diğer",
      Unknown: "Bilinmiyor",
    };
    return labels[reason] || reason;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white">Kaybedilme Nedenleri</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bu ay</p>
      </div>
      <div className="p-4">
        {reasons.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">Henüz veri yok</p>
        ) : (
          <div className="space-y-3">
            {reasons.map((reason) => {
              const percentage = total > 0 ? Math.round((reason.count / total) * 100) : 0;
              return (
                <div key={reason.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-900 dark:text-white">{getReasonLabel(reason.reason)}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {reason.count} (%{percentage})
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${(reason.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
