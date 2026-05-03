import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { generatePdfReport } from './pdf.generator';
import { generateExcelReport } from './excel.generator';
import { Decimal } from '@prisma/client/runtime/library';

// ---------- helpers ----------

function parseDateRange(req: Request) {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : new Date(new Date().getFullYear(), 0, 1); // default: start of year
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : new Date();
  // set endDate to end of day
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
}

function decimalToNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

type CurrencyTotals = Record<string, number>;

function sumByCurrency(
  items: { price: Decimal | null; currency: string | null }[]
): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const item of items) {
    const cur = item.currency || 'USD';
    totals[cur] = (totals[cur] || 0) + decimalToNumber(item.price);
  }
  return totals;
}

// ---------- periodicQuotes ----------

export async function periodicQuotes(req: Request, res: Response) {
  const { startDate, endDate } = parseDateRange(req);
  const assignedUserId = req.query.assignedUserId
    ? Number(req.query.assignedUserId)
    : undefined;
  const transportMode = req.query.transportMode as string | undefined;
  const currency = req.query.currency as string | undefined;

  const where: any = {
    quoteDate: { gte: startDate, lte: endDate },
    isDeleted: false,
  };
  if (assignedUserId) where.assignedUserId = assignedUserId;
  if (transportMode) where.transportMode = transportMode;
  if (currency) where.currency = currency;

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { companyName: true } },
      assignedUser: { select: { fullName: true } },
    },
    orderBy: { quoteDate: 'desc' },
  });

  const total = quotations.length;
  const won = quotations.filter((q) => q.status === 'Kazanıldı').length;
  const lost = quotations.filter((q) => q.status === 'Kaybedildi').length;
  const pending = quotations.filter((q) => q.status === 'Bekliyor').length;
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

  const totalValue = sumByCurrency(
    quotations.map((q) => ({ price: q.price, currency: q.currency }))
  );

  res.json({
    success: true,
    data: {
      quotations,
      summary: { total, won, lost, pending, totalValue, winRate },
    },
  });
}

// ---------- staffPerformance ----------

export async function staffPerformance(req: Request, res: Response) {
  const { startDate, endDate } = parseDateRange(req);

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, fullName: true },
  });

  const staff = await Promise.all(
    users.map(async (user) => {
      const quotes = await prisma.quotation.findMany({
        where: {
          assignedUserId: user.id,
          quoteDate: { gte: startDate, lte: endDate },
          isDeleted: false,
        },
        select: { status: true, price: true, currency: true },
      });

      const totalQuotes = quotes.length;
      const wonQuotes = quotes.filter((q) => q.status === 'Kazanıldı').length;
      const lostQuotes = quotes.filter((q) => q.status === 'Kaybedildi').length;
      const winRate = totalQuotes > 0 ? Math.round((wonQuotes / totalQuotes) * 100) : 0;

      const totalActivities = await prisma.activity.count({
        where: {
          createdById: user.id,
          activityDate: { gte: startDate, lte: endDate },
          isDeleted: false,
        },
      });

      const contactedCustomers = await prisma.activity.groupBy({
        by: ['customerId'],
        where: {
          createdById: user.id,
          activityDate: { gte: startDate, lte: endDate },
          isDeleted: false,
        },
      });

      const priceValues = quotes
        .filter((q) => q.price)
        .map((q) => decimalToNumber(q.price));
      const avgQuoteValue =
        priceValues.length > 0
          ? Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length)
          : 0;

      return {
        userId: user.id,
        fullName: user.fullName,
        totalQuotes,
        wonQuotes,
        lostQuotes,
        winRate,
        totalActivities,
        contactedCustomers: contactedCustomers.length,
        avgQuoteValue,
      };
    })
  );

  res.json({ success: true, data: { staff } });
}

// ---------- winLoss ----------

export async function winLoss(req: Request, res: Response) {
  const { startDate, endDate } = parseDateRange(req);

  const baseWhere = {
    quoteDate: { gte: startDate, lte: endDate },
    isDeleted: false,
  };

  const include = {
    customer: { select: { companyName: true } },
    assignedUser: { select: { fullName: true } },
  };

  const [won, lost] = await Promise.all([
    prisma.quotation.findMany({
      where: { ...baseWhere, status: 'Kazanıldı' },
      include,
      orderBy: { quoteDate: 'desc' },
    }),
    prisma.quotation.findMany({
      where: { ...baseWhere, status: 'Kaybedildi' },
      include,
      orderBy: { quoteDate: 'desc' },
    }),
  ]);

  const wonValue = sumByCurrency(
    won.map((q) => ({ price: q.price, currency: q.currency }))
  );
  const lostValue = sumByCurrency(
    lost.map((q) => ({ price: q.price, currency: q.currency }))
  );

  res.json({
    success: true,
    data: {
      won,
      lost,
      summary: {
        wonCount: won.length,
        lostCount: lost.length,
        wonValue,
        lostValue,
      },
    },
  });
}

// ---------- countryModeVolume ----------

export async function countryModeVolume(req: Request, res: Response) {
  const { startDate, endDate } = parseDateRange(req);

  const quotations = await prisma.quotation.findMany({
    where: {
      quoteDate: { gte: startDate, lte: endDate },
      isDeleted: false,
    },
    select: {
      originCountry: true,
      destinationCountry: true,
      transportMode: true,
      price: true,
      currency: true,
      quoteDate: true,
    },
  });

  // by country pair
  const countryMap = new Map<string, { count: number; totalValue: number }>();
  for (const q of quotations) {
    const key = `${q.originCountry || '-'}|${q.destinationCountry || '-'}`;
    const entry = countryMap.get(key) || { count: 0, totalValue: 0 };
    entry.count++;
    entry.totalValue += decimalToNumber(q.price);
    countryMap.set(key, entry);
  }
  const byCountry = Array.from(countryMap.entries())
    .map(([key, val]) => {
      const [originCountry, destinationCountry] = key.split('|');
      return { originCountry, destinationCountry, ...val };
    })
    .sort((a, b) => b.count - a.count);

  // by transport mode
  const modeMap = new Map<string, { count: number; totalValue: number }>();
  for (const q of quotations) {
    const mode = q.transportMode || 'Bilinmiyor';
    const entry = modeMap.get(mode) || { count: 0, totalValue: 0 };
    entry.count++;
    entry.totalValue += decimalToNumber(q.price);
    modeMap.set(mode, entry);
  }
  const byMode = Array.from(modeMap.entries())
    .map(([transportMode, val]) => ({
      transportMode,
      ...val,
      avgValue: val.count > 0 ? Math.round(val.totalValue / val.count) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // monthly trend
  const trendMap = new Map<string, number>();
  for (const q of quotations) {
    const d = new Date(q.quoteDate);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendMap.set(month, (trendMap.get(month) || 0) + 1);
  }
  const trend = Array.from(trendMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  res.json({ success: true, data: { byCountry, byMode, trend } });
}

// ---------- lossReasons ----------

export async function lossReasons(req: Request, res: Response) {
  const { startDate, endDate } = parseDateRange(req);

  const lostQuotations = await prisma.quotation.findMany({
    where: {
      status: 'Kaybedildi',
      quoteDate: { gte: startDate, lte: endDate },
      isDeleted: false,
    },
    select: { lossReason: true, price: true, currency: true },
  });

  const total = lostQuotations.length;

  const reasonMap = new Map<string, { count: number; totalValue: number }>();
  for (const q of lostQuotations) {
    const reason = q.lossReason || 'Belirtilmemis';
    const entry = reasonMap.get(reason) || { count: 0, totalValue: 0 };
    entry.count++;
    entry.totalValue += decimalToNumber(q.price);
    reasonMap.set(reason, entry);
  }

  const reasons = Array.from(reasonMap.entries())
    .map(([reason, val]) => ({
      reason,
      count: val.count,
      percentage: total > 0 ? Math.round((val.count / total) * 100) : 0,
      totalValue: val.totalValue,
    }))
    .sort((a, b) => b.count - a.count);

  res.json({ success: true, data: { reasons, total } });
}

// ---------- exportReport ----------

// Internal data fetchers for export (reuse logic without res)
async function fetchReportData(reportType: string, query: any) {
  const startDate = query.startDate
    ? new Date(query.startDate as string)
    : new Date(new Date().getFullYear(), 0, 1);
  const endDate = query.endDate ? new Date(query.endDate as string) : new Date();
  endDate.setHours(23, 59, 59, 999);

  switch (reportType) {
    case 'periodic-quotes': {
      const where: any = {
        quoteDate: { gte: startDate, lte: endDate },
        isDeleted: false,
      };
      if (query.assignedUserId) where.assignedUserId = Number(query.assignedUserId);
      if (query.transportMode) where.transportMode = query.transportMode;
      if (query.currency) where.currency = query.currency;

      const quotations = await prisma.quotation.findMany({
        where,
        include: {
          customer: { select: { companyName: true } },
          assignedUser: { select: { fullName: true } },
        },
        orderBy: { quoteDate: 'desc' },
      });

      return {
        title: 'Dönemsel Teklif Raporu',
        columns: ['Teklif No', 'Müşteri', 'Tarih', 'Mod', 'Fiyat', 'Para Birimi', 'Durum', 'Sorumlu'],
        excelColumns: [
          { header: 'Teklif No', key: 'quoteNo', width: 15 },
          { header: 'Müşteri', key: 'customer', width: 25 },
          { header: 'Tarih', key: 'date', width: 12 },
          { header: 'Mod', key: 'mode', width: 12 },
          { header: 'Fiyat', key: 'price', width: 12 },
          { header: 'Para Birimi', key: 'currency', width: 10 },
          { header: 'Durum', key: 'status', width: 12 },
          { header: 'Sorumlu', key: 'assignedUser', width: 20 },
        ],
        rows: quotations.map((q) => [
          q.quoteNo,
          q.customer.companyName,
          new Date(q.quoteDate).toLocaleDateString('tr-TR'),
          q.transportMode || '-',
          decimalToNumber(q.price).toString(),
          q.currency || 'USD',
          q.status,
          q.assignedUser.fullName,
        ]),
        excelRows: quotations.map((q) => ({
          quoteNo: q.quoteNo,
          customer: q.customer.companyName,
          date: new Date(q.quoteDate).toLocaleDateString('tr-TR'),
          mode: q.transportMode || '-',
          price: decimalToNumber(q.price),
          currency: q.currency || 'USD',
          status: q.status,
          assignedUser: q.assignedUser.fullName,
        })),
      };
    }

    case 'staff-performance': {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true },
      });

      const staffData = await Promise.all(
        users.map(async (user) => {
          const quotes = await prisma.quotation.findMany({
            where: {
              assignedUserId: user.id,
              quoteDate: { gte: startDate, lte: endDate },
              isDeleted: false,
            },
            select: { status: true, price: true },
          });
          const totalQuotes = quotes.length;
          const wonQuotes = quotes.filter((q) => q.status === 'Kazanıldı').length;
          const lostQuotes = quotes.filter((q) => q.status === 'Kaybedildi').length;
          const winRate = totalQuotes > 0 ? Math.round((wonQuotes / totalQuotes) * 100) : 0;
          const totalActivities = await prisma.activity.count({
            where: {
              createdById: user.id,
              activityDate: { gte: startDate, lte: endDate },
              isDeleted: false,
            },
          });
          return {
            fullName: user.fullName,
            totalQuotes,
            wonQuotes,
            lostQuotes,
            winRate,
            totalActivities,
          };
        })
      );

      return {
        title: 'Personel Performans Raporu',
        columns: ['Personel', 'Toplam Teklif', 'Kazanılan', 'Kaybedilen', 'Kazanma %', 'Aktiviteler'],
        excelColumns: [
          { header: 'Personel', key: 'fullName', width: 25 },
          { header: 'Toplam Teklif', key: 'totalQuotes', width: 14 },
          { header: 'Kazanılan', key: 'wonQuotes', width: 12 },
          { header: 'Kaybedilen', key: 'lostQuotes', width: 12 },
          { header: 'Kazanma %', key: 'winRate', width: 10 },
          { header: 'Aktiviteler', key: 'totalActivities', width: 12 },
        ],
        rows: staffData.map((s) => [
          s.fullName,
          s.totalQuotes.toString(),
          s.wonQuotes.toString(),
          s.lostQuotes.toString(),
          `${s.winRate}%`,
          s.totalActivities.toString(),
        ]),
        excelRows: staffData,
      };
    }

    case 'win-loss': {
      const include = {
        customer: { select: { companyName: true } },
        assignedUser: { select: { fullName: true } },
      };
      const baseWhere = {
        quoteDate: { gte: startDate, lte: endDate },
        isDeleted: false,
      };
      const [won, lost] = await Promise.all([
        prisma.quotation.findMany({ where: { ...baseWhere, status: 'Kazanıldı' }, include }),
        prisma.quotation.findMany({ where: { ...baseWhere, status: 'Kaybedildi' }, include }),
      ]);

      const allItems = [
        ...won.map((q) => ({ ...q, _result: 'Kazanıldı' })),
        ...lost.map((q) => ({ ...q, _result: 'Kaybedildi' })),
      ];

      return {
        title: 'Kazanma/Kaybetme Raporu',
        columns: ['Teklif No', 'Müşteri', 'Tarih', 'Fiyat', 'Para Birimi', 'Durum', 'Kayip Nedeni', 'Sorumlu'],
        excelColumns: [
          { header: 'Teklif No', key: 'quoteNo', width: 15 },
          { header: 'Müşteri', key: 'customer', width: 25 },
          { header: 'Tarih', key: 'date', width: 12 },
          { header: 'Fiyat', key: 'price', width: 12 },
          { header: 'Para Birimi', key: 'currency', width: 10 },
          { header: 'Durum', key: 'status', width: 12 },
          { header: 'Kayip Nedeni', key: 'lossReason', width: 20 },
          { header: 'Sorumlu', key: 'assignedUser', width: 20 },
        ],
        rows: allItems.map((q) => [
          q.quoteNo,
          q.customer.companyName,
          new Date(q.quoteDate).toLocaleDateString('tr-TR'),
          decimalToNumber(q.price).toString(),
          q.currency || 'USD',
          q._result,
          q.lossReason || '-',
          q.assignedUser.fullName,
        ]),
        excelRows: allItems.map((q) => ({
          quoteNo: q.quoteNo,
          customer: q.customer.companyName,
          date: new Date(q.quoteDate).toLocaleDateString('tr-TR'),
          price: decimalToNumber(q.price),
          currency: q.currency || 'USD',
          status: q._result,
          lossReason: q.lossReason || '-',
          assignedUser: q.assignedUser.fullName,
        })),
      };
    }

    case 'country-mode-volume': {
      const quotations = await prisma.quotation.findMany({
        where: {
          quoteDate: { gte: startDate, lte: endDate },
          isDeleted: false,
        },
        select: {
          originCountry: true,
          destinationCountry: true,
          transportMode: true,
          price: true,
        },
      });

      const countryMap = new Map<string, { count: number; totalValue: number }>();
      for (const q of quotations) {
        const key = `${q.originCountry || '-'}|${q.destinationCountry || '-'}`;
        const entry = countryMap.get(key) || { count: 0, totalValue: 0 };
        entry.count++;
        entry.totalValue += decimalToNumber(q.price);
        countryMap.set(key, entry);
      }
      const byCountry = Array.from(countryMap.entries())
        .map(([key, val]) => {
          const [origin, dest] = key.split('|');
          return { origin, dest, ...val };
        })
        .sort((a, b) => b.count - a.count);

      return {
        title: 'Ülke ve Mod Hacim Raporu',
        columns: ['Çıkış Ülkesi', 'Varış Ülkesi', 'Teklif Sayısı', 'Toplam Deger'],
        excelColumns: [
          { header: 'Çıkış Ülkesi', key: 'origin', width: 18 },
          { header: 'Varış Ülkesi', key: 'dest', width: 18 },
          { header: 'Teklif Sayısı', key: 'count', width: 14 },
          { header: 'Toplam Deger', key: 'totalValue', width: 15 },
        ],
        rows: byCountry.map((c) => [
          c.origin,
          c.dest,
          c.count.toString(),
          c.totalValue.toString(),
        ]),
        excelRows: byCountry,
      };
    }

    case 'loss-reasons': {
      const lostQuotations = await prisma.quotation.findMany({
        where: {
          status: 'Kaybedildi',
          quoteDate: { gte: startDate, lte: endDate },
          isDeleted: false,
        },
        select: { lossReason: true, price: true },
      });

      const total = lostQuotations.length;
      const reasonMap = new Map<string, { count: number; totalValue: number }>();
      for (const q of lostQuotations) {
        const reason = q.lossReason || 'Belirtilmemis';
        const entry = reasonMap.get(reason) || { count: 0, totalValue: 0 };
        entry.count++;
        entry.totalValue += decimalToNumber(q.price);
        reasonMap.set(reason, entry);
      }

      const reasons = Array.from(reasonMap.entries())
        .map(([reason, val]) => ({
          reason,
          count: val.count,
          percentage: total > 0 ? Math.round((val.count / total) * 100) : 0,
          totalValue: val.totalValue,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        title: 'Kayip Nedenleri Raporu',
        columns: ['Neden', 'Sayi', 'Yuzde', 'Toplam Deger'],
        excelColumns: [
          { header: 'Neden', key: 'reason', width: 25 },
          { header: 'Sayi', key: 'count', width: 10 },
          { header: 'Yuzde', key: 'percentage', width: 10 },
          { header: 'Toplam Deger', key: 'totalValue', width: 15 },
        ],
        rows: reasons.map((r) => [
          r.reason,
          r.count.toString(),
          `${r.percentage}%`,
          r.totalValue.toString(),
        ]),
        excelRows: reasons,
      };
    }

    default:
      throw new Error(`Bilinmeyen rapor tipi: ${reportType}`);
  }
}

export async function exportReport(req: Request, res: Response) {
  const { type } = req.params; // 'pdf' or 'excel'
  const reportType = req.query.reportType as string;

  if (!reportType) {
    return res.status(400).json({ success: false, message: 'reportType parametresi gerekli' });
  }

  if (!['pdf', 'excel'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Gecersiz export tipi. pdf veya excel olmali' });
  }

  const data = await fetchReportData(reportType, req.query);
  const dateRange = {
    startDate: (req.query.startDate as string) || new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('tr-TR'),
    endDate: (req.query.endDate as string) || new Date().toLocaleDateString('tr-TR'),
  };

  if (type === 'pdf') {
    const buffer = await generatePdfReport(data.title, data.columns, data.rows, dateRange);
    const filename = `${reportType}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  // excel
  const buffer = await generateExcelReport(data.title, data.excelColumns, data.excelRows);
  const filename = `${reportType}-${Date.now()}.xlsx`;
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(buffer);
}
