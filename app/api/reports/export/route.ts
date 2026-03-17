import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Whitelist of allowed fields per report type
const ALLOWED_FIELDS: Record<string, string[]> = {
  "periodic-quotation": ["id", "quoteNumber", "customerName", "transportMode", "origin", "destination", "totalCost", "currency", "status", "createdAt", "createdBy"],
  "personnel-performance": ["userId", "name", "email", "role", "totalQuotes", "wonQuotes", "lostQuotes", "winRate", "totalValue", "wonValue", "activities"],
  "won-lost-analysis": ["id", "quoteNumber", "customerName", "transportMode", "origin", "destination", "totalCost", "currency", "status", "createdAt", "createdBy"],
  "country-mode-volume": ["country", "count", "value"],
  "loss-reason": ["id", "label", "count", "value", "percentage"],
};

function sanitizeExportData(data: unknown, reportType: string): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return {};
  }

  const dataObj = data as Record<string, unknown>;
  const allowedFields = ALLOWED_FIELDS[reportType] || [];
  const sanitized: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (key in dataObj) {
      sanitized[key] = dataObj[key];
    }
  }

  return sanitized;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

export type ExportFormat = "pdf" | "excel";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { format, reportType, data, filename } = body;

    if (!format || !reportType || !data) {
      return NextResponse.json(
        { error: "Missing required parameters: format, reportType, data" },
        { status: 400 }
      );
    }

    if (!["pdf", "excel"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be 'pdf' or 'excel'" },
        { status: 400 }
      );
    }

    // Validate data fields to prevent injection
    const sanitizedData = sanitizeExportData(data, reportType);

    const timestamp = new Date().toISOString().split("T")[0];
    const defaultFilename = `${reportType}-${timestamp}`;
    const finalFilename = filename || defaultFilename;

    if (format === "excel") {
      const csv = generateCSV(sanitizedData, reportType);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${finalFilename}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const html = generatePDFHTML(sanitizedData, reportType);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${finalFilename}.html"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported export format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

function generateCSV(data: unknown, reportType: string): string {
  let rows: Record<string, unknown>[] = [];

  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;
    
    switch (reportType) {
      case "periodic-quotation":
        rows = (dataObj.quotations as Record<string, unknown>[]) || [];
        break;
      case "personnel-performance":
        rows = (dataObj.personnel as Record<string, unknown>[]) || [];
        break;
      case "won-lost-analysis":
        rows = (dataObj.quotations as Record<string, unknown>[]) || [];
        break;
      case "country-mode-volume":
        rows = (dataObj.byOriginCountry as Record<string, unknown>[]) || [];
        break;
      case "loss-reason":
        rows = (dataObj.lossReasons as Record<string, unknown>[]) || [];
        break;
      default:
        rows = [];
    }
  }

  if (rows.length === 0) {
    return "No data available\n";
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const stringValue =
            value === null || value === undefined ? "" : String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ];

  return "\uFEFF" + csvRows.join("\n") + "\n";
}

function generatePDFHTML(data: unknown, reportType: string): string {
  const dataObj = data as Record<string, unknown>;
  const period = (dataObj.period as { startDate: string; endDate: string }) || {
    startDate: "",
    endDate: "",
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("tr-TR");
  };

  let content = "";

  switch (reportType) {
    case "periodic-quotation": {
      const summary = dataObj.summary as Record<string, unknown>;
      const quotations = (dataObj.quotations as Record<string, unknown>[]) || [];
      content = `
        <h2>Özet</h2>
        <table>
          <tr><td>Toplam Teklif:</td><td>${summary?.totalQuotes || 0}</td></tr>
          <tr><td>Kazanılan:</td><td>${summary?.wonQuotes || 0}</td></tr>
          <tr><td>Kaybedilen:</td><td>${summary?.lostQuotes || 0}</td></tr>
          <tr><td>Bekleyen:</td><td>${summary?.pendingQuotes || 0}</td></tr>
          <tr><td>Kazanma Oranı:</td><td>${summary?.winRate || 0}%</td></tr>
        </table>
        <h2>Teklif Listesi</h2>
        <table>
          <thead>
            <tr>
              <th>Teklif No</th>
              <th>Müşteri</th>
              <th>Mod</th>
              <th>Başlangıç</th>
              <th>Varış</th>
              <th>Tutar</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            ${quotations
              .map(
                (q) => `
              <tr>
                <td>${escapeHtml(String(q.quoteNumber || ''))}</td>
                <td>${escapeHtml(String(q.customerName || ''))}</td>
                <td>${escapeHtml(String(q.transportMode || ''))}</td>
                <td>${escapeHtml(String(q.origin || ''))}</td>
                <td>${escapeHtml(String(q.destination || ''))}</td>
                <td>${Number(q.totalCost || 0).toLocaleString('tr-TR')} ${escapeHtml(String(q.currency || ''))}</td>
                <td>${escapeHtml(String(q.status || ''))}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      break;
    }

    case "personnel-performance": {
      const summary = dataObj.summary as Record<string, unknown>;
      const personnel = (dataObj.personnel as Record<string, unknown>[]) || [];
      content = `
        <h2>Özet</h2>
        <table>
          <tr><td>Toplam Teklif:</td><td>${summary?.totalQuotes || 0}</td></tr>
          <tr><td>Kazanılan:</td><td>${summary?.wonQuotes || 0}</td></tr>
          <tr><td>Genel Kazanma Oranı:</td><td>${summary?.overallWinRate || 0}%</td></tr>
        </table>
        <h2>Personel Performansı</h2>
        <table>
          <thead>
            <tr>
              <th>Personel</th>
              <th>Rol</th>
              <th>Teklif</th>
              <th>Kazanılan</th>
              <th>Kaybedilen</th>
              <th>Oran</th>
              <th>Toplam Değer</th>
              <th>Aktivite</th>
            </tr>
          </thead>
          <tbody>
            ${personnel
              .map(
                (p) => `
              <tr>
                <td>${escapeHtml(String(p.name || ''))}</td>
                <td>${escapeHtml(String(p.role || ''))}</td>
                <td>${p.totalQuotes || 0}</td>
                <td>${p.wonQuotes || 0}</td>
                <td>${p.lostQuotes || 0}</td>
                <td>${p.winRate || 0}%</td>
                <td>${Number(p.totalValue || 0).toLocaleString('tr-TR')}</td>
                <td>${p.activities || 0}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      break;
    }

    case "won-lost-analysis": {
      const summary = dataObj.summary as Record<string, unknown>;
      const quotations = (dataObj.quotations as Record<string, unknown>[]) || [];
      content = `
        <h2>Özet</h2>
        <table>
          <tr><td>Toplam Karar:</td><td>${summary?.totalDecided || 0}</td></tr>
          <tr><td>Kazanılan:</td><td>${summary?.wonCount || 0}</td></tr>
          <tr><td>Kaybedilen:</td><td>${summary?.lostCount || 0}</td></tr>
          <tr><td>Kazanma Oranı:</td><td>${summary?.winRate || 0}%</td></tr>
        </table>
        <h2>Teklif Listesi</h2>
        <table>
          <thead>
            <tr>
              <th>Teklif No</th>
              <th>Müşteri</th>
              <th>Mod</th>
              <th>Başlangıç</th>
              <th>Varış</th>
              <th>Tutar</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            ${quotations
              .map(
                (q) => `
              <tr>
                <td>${escapeHtml(String(q.quoteNumber || ''))}</td>
                <td>${escapeHtml(String(q.customerName || ''))}</td>
                <td>${escapeHtml(String(q.transportMode || ''))}</td>
                <td>${escapeHtml(String(q.origin || ''))}</td>
                <td>${escapeHtml(String(q.destination || ''))}</td>
                <td>${Number(q.totalCost || 0).toLocaleString('tr-TR')} ${escapeHtml(String(q.currency || ''))}</td>
                <td>${escapeHtml(String(q.status || ''))}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      break;
    }

    case "country-mode-volume": {
      const summary = dataObj.summary as Record<string, unknown>;
      const byOrigin = (dataObj.byOriginCountry as Record<string, unknown>[]) || [];
      const byDestination =
        (dataObj.byDestinationCountry as Record<string, unknown>[]) || [];
      content = `
        <h2>Özet</h2>
        <table>
          <tr><td>Toplam Teklif:</td><td>${summary?.totalQuotations || 0}</td></tr>
          <tr><td>Benzersiz Çıkış Ülkesi:</td><td>${summary?.uniqueOrigins || 0}</td></tr>
          <tr><td>Benzersiz Varış Ülkesi:</td><td>${summary?.uniqueDestinations || 0}</td></tr>
        </table>
        <h2>Çıkış Ülkesine Göre</h2>
        <table>
          <thead>
            <tr>
              <th>Ülke</th>
              <th>Teklif Sayısı</th>
              <th>Toplam Değer</th>
            </tr>
          </thead>
          <tbody>
            ${byOrigin
              .map(
                (c) => `
              <tr>
                <td>${escapeHtml(String(c.country || ''))}</td>
                <td>${c.count || 0}</td>
                <td>${Number(c.value || 0).toLocaleString('tr-TR')}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <h2>Varış Ülkesine Göre</h2>
        <table>
          <thead>
            <tr>
              <th>Ülke</th>
              <th>Teklif Sayısı</th>
              <th>Toplam Değer</th>
            </tr>
          </thead>
          <tbody>
            ${byDestination
              .map(
                (c) => `
              <tr>
                <td>${escapeHtml(String(c.country || ''))}</td>
                <td>${c.count || 0}</td>
                <td>${Number(c.value || 0).toLocaleString('tr-TR')}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      break;
    }

    case "loss-reason": {
      const summary = dataObj.summary as Record<string, unknown>;
      const lossReasons = (dataObj.lossReasons as Record<string, unknown>[]) || [];
      content = `
        <h2>Özet</h2>
        <table>
          <tr><td>Toplam Kayıp:</td><td>${summary?.totalLostQuotes || 0}</td></tr>
          <tr><td>Toplam Kayıp Değer:</td><td>${Number(summary?.totalLostValue || 0).toLocaleString('tr-TR')}</td></tr>
          <tr><td>Ortalama Kayıp Değer:</td><td>${Number(summary?.averageLostValue || 0).toLocaleString('tr-TR')}</td></tr>
        </table>
        <h2>Kaybedilme Nedenleri</h2>
        <table>
          <thead>
            <tr>
              <th>Neden</th>
              <th>Sayı</th>
              <th>Değer</th>
              <th>Oran</th>
            </tr>
          </thead>
          <tbody>
            ${lossReasons
              .map(
                (r) => `
              <tr>
                <td>${escapeHtml(String(r.label || ''))}</td>
                <td>${r.count || 0}</td>
                <td>${Number(r.value || 0).toLocaleString('tr-TR')}</td>
                <td>${r.percentage || 0}%</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      break;
    }

    default:
      content = "<p>Rapor verisi bulunamadı.</p>";
  }

  // Escape the title as well
  const safeTitle = escapeHtml(String(reportType));

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle} Raporu</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #1258e2;
      border-bottom: 2px solid #1258e2;
      padding-bottom: 10px;
    }
    h2 {
      color: #444;
      margin-top: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    .period {
      color: #666;
      font-style: italic;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>${safeTitle} Raporu</h1>
  <p class="period">Dönem: ${formatDate(period.startDate)} - ${formatDate(
    period.endDate
  )}</p>
  ${content}
</body>
</html>`;
}
