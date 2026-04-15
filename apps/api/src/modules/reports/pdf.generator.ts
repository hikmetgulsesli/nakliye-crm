/**
 * PDF-like report generator - produces a print-friendly HTML document
 */
export function generatePdfReport(
  title: string,
  columns: string[],
  rows: string[][],
  dateRange?: { startDate: string; endDate: string }
): Buffer {
  const dateInfo = dateRange
    ? `<p class="date-range">${dateRange.startDate} - ${dateRange.endDate}</p>`
    : '';

  const headerRow = columns.map((col) => `<th>${escapeHtml(col)}</th>`).join('');
  const dataRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? '')}</td>`).join('')}</tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - NakliyeCRM</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      padding: 24px;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #1976d2;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 24px;
      font-weight: 700;
      color: #1976d2;
    }
    .report-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .date-range {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }
    .generated {
      font-size: 12px;
      color: #999;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 13px;
    }
    th {
      background: #1976d2;
      color: #fff;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    tr:nth-child(even) { background: #f5f5f5; }
    tr:hover { background: #e3f2fd; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .header { border-bottom-width: 2px; }
      tr:hover { background: inherit; }
      tr:nth-child(even) { background: #f9f9f9; }
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="brand">NakliyeCRM</span>
    <span class="generated">Olusturulma: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</span>
  </div>
  <h1 class="report-title">${escapeHtml(title)}</h1>
  ${dateInfo}
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${dataRows}</tbody>
  </table>
  <div class="footer">
    NakliyeCRM Rapor Sistemi &bull; Toplam ${rows.length} kayit
  </div>
</body>
</html>`;

  return Buffer.from(html, 'utf-8');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
