import PDFDocument from 'pdfkit';
import vfsModule from 'pdfmake/build/vfs_fonts';
import { getSetting } from '../../services/system-settings.service';

/**
 * pdfkit ile gercek PDF uretir. Roboto ttf font'unu pdfmake'in
 * yerlesik vfs paketinden okuyup registerFont ile yukluyoruz —
 * Turkce karakterleri (ş ç ğ ü ö ı İ vs.) sorunsuz render eder.
 */

const vfsAny = vfsModule as unknown as Record<string, string>;

let cachedFonts: { regular: Buffer; bold: Buffer } | null = null;
function getFonts() {
  if (cachedFonts) return cachedFonts;
  const reg = vfsAny['Roboto-Regular.ttf'];
  const bold = vfsAny['Roboto-Medium.ttf'];
  if (!reg || !bold) {
    throw new Error('pdfmake/build/vfs_fonts icinde Roboto font bulunamadi');
  }
  cachedFonts = {
    regular: Buffer.from(reg, 'base64'),
    bold: Buffer.from(bold, 'base64'),
  };
  return cachedFonts;
}

export async function generatePdfReport(
  title: string,
  columns: string[],
  rows: string[][],
  dateRange?: { startDate: string; endDate: string },
): Promise<Buffer> {
  const fonts = getFonts();
  const isLandscape = columns.length > 6;
  const margin = 36;
  const pageWidth = isLandscape ? 842 : 595; // A4
  const pageHeight = isLandscape ? 595 : 842;

  const brandName =
    (await getSetting<string>('brand.company_name')) || 'NakliyeCRM';
  const brandColor =
    (await getSetting<string>('brand.primary_color')) || '#1976d2';

  const doc = new PDFDocument({
    size: 'A4',
    layout: isLandscape ? 'landscape' : 'portrait',
    margin,
    info: { Title: title, Creator: brandName, Producer: brandName },
  });

  doc.registerFont('Roboto', fonts.regular);
  doc.registerFont('Roboto-Bold', fonts.bold);
  doc.font('Roboto');

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // ---------------- Header ----------------
  doc
    .fillColor(brandColor)
    .font('Roboto-Bold')
    .fontSize(14)
    .text(brandName, margin, margin, { continued: false });

  doc
    .fillColor('#888')
    .font('Roboto')
    .fontSize(9)
    .text(
      `Oluşturulma: ${new Date().toLocaleString('tr-TR')}`,
      margin,
      margin,
      { align: 'right', width: pageWidth - margin * 2 },
    );

  // ---------------- Title ----------------
  doc
    .fillColor('#000')
    .font('Roboto-Bold')
    .fontSize(16)
    .text(title, margin, margin + 28);

  if (dateRange) {
    doc
      .fillColor('#666')
      .font('Roboto')
      .fontSize(10)
      .text(`${dateRange.startDate} – ${dateRange.endDate}`, margin, margin + 50);
  }

  // ---------------- Table ----------------
  const tableTop = margin + (dateRange ? 78 : 60);
  const usableWidth = pageWidth - margin * 2;
  const colWidth = usableWidth / Math.max(1, columns.length);
  const rowHeight = 22;
  const cellPad = 4;

  function drawHeaderRow(y: number) {
    doc.rect(margin, y, usableWidth, rowHeight).fill(brandColor);
    doc.fillColor('#fff').font('Roboto-Bold').fontSize(9);
    columns.forEach((col, i) => {
      doc.text(
        col,
        margin + i * colWidth + cellPad,
        y + cellPad + 2,
        { width: colWidth - cellPad * 2, height: rowHeight - cellPad * 2, ellipsis: true },
      );
    });
  }

  function drawRow(values: string[], y: number, alt: boolean) {
    if (alt) {
      doc.rect(margin, y, usableWidth, rowHeight).fill('#f5f5f5');
    }
    doc.fillColor('#000').font('Roboto').fontSize(9);
    values.forEach((cell, i) => {
      doc.text(
        String(cell ?? ''),
        margin + i * colWidth + cellPad,
        y + cellPad + 2,
        { width: colWidth - cellPad * 2, height: rowHeight - cellPad * 2, ellipsis: true },
      );
    });
    // Bottom border
    doc
      .strokeColor('#e0e0e0')
      .lineWidth(0.5)
      .moveTo(margin, y + rowHeight)
      .lineTo(margin + usableWidth, y + rowHeight)
      .stroke();
  }

  let y = tableTop;
  drawHeaderRow(y);
  y += rowHeight;

  rows.forEach((row, idx) => {
    // Sayfa sonuna gelince yeni sayfa ac
    if (y + rowHeight > pageHeight - margin - 30) {
      doc.addPage({
        size: 'A4',
        layout: isLandscape ? 'landscape' : 'portrait',
        margin,
      });
      y = margin;
      drawHeaderRow(y);
      y += rowHeight;
    }
    drawRow(row, y, idx % 2 === 1);
    y += rowHeight;
  });

  // ---------------- Footer ----------------
  // Tum sayfalara footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fillColor('#999')
      .font('Roboto')
      .fontSize(8)
      .text(
        `Toplam ${rows.length} kayıt`,
        margin,
        pageHeight - margin - 10,
        { width: usableWidth / 2 },
      )
      .text(
        `${i + 1}/${range.count}`,
        margin + usableWidth / 2,
        pageHeight - margin - 10,
        { width: usableWidth / 2, align: 'right' },
      );
  }

  doc.end();
  return done;
}
