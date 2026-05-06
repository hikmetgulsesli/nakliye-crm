import PDFDocument from 'pdfkit';
import vfsModule from 'pdfmake/build/vfs_fonts';
import { getSetting } from '../../services/system-settings.service';

/**
 * Teklif PDF jeneratoru — kurumsal teklif belgesi formatinda.
 * pdfkit + Roboto (TR karakter destekli) ile gercek metin/layout uretir,
 * ekran goruntusu kalitesinden farkli olarak yazici dostu net bir cikti olur.
 *
 * Brand sistemi (system-settings) icin renk + isim okunur; logo path'i
 * varsa header'a yerlestirilebilir (su an text-based brand header).
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

export interface QuotationPdfData {
  quoteNo: string;
  quoteDate?: Date | string | null;
  validityDate?: Date | string | null;
  status: string;
  // Tasima
  transportMode?: string | null;
  serviceType?: string | null;
  originCountry?: string | null;
  pol?: string | null;
  destinationCountry?: string | null;
  pod?: string | null;
  incoterm?: string | null;
  // Fiyat
  price?: number | null;
  currency?: string | null;
  priceNote?: string | null;
  // Musteri
  customer: {
    companyName: string;
    contactName?: string | null;
    taxNumber?: string | null;
    taxOffice?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  // Olusturan
  assignedUserName?: string | null;
}

function fmtDate(d?: Date | string | null): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function currencySymbol(currency?: string | null): string {
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '€';
  if (currency === 'TRY') return '₺';
  return '';
}

function fmtPrice(price?: number | null, currency?: string | null): string {
  if (price == null) return '-';
  const sym = currencySymbol(currency);
  return `${sym}${price.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}${currency ? ' ' + currency : ''}`;
}

function transportLabel(mode?: string | null): string {
  if (!mode) return '-';
  const m = mode.toLowerCase();
  if (m === 'deniz') return 'Deniz Yolu';
  if (m === 'hava') return 'Hava Yolu';
  if (m === 'kara') return 'Kara Yolu';
  if (m === 'demiryolu' || m === 'tren') return 'Demiryolu';
  if (m === 'kombine') return 'Kombine Tasima';
  return mode;
}

export async function generateQuotationPdf(q: QuotationPdfData): Promise<Buffer> {
  const fonts = getFonts();
  const margin = 40;
  const pageWidth = 595; // A4 portrait
  const innerWidth = pageWidth - margin * 2;

  const brandName = (await getSetting<string>('brand.company_name')) || 'Nakliye CRM';
  const brandColor = (await getSetting<string>('brand.primary_color')) || '#1976d2';
  const brandTagline = (await getSetting<string>('brand.tagline')) || '';
  const emailFromName = (await getSetting<string>('brand.email_from_name')) || brandName;

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margin,
    info: {
      Title: `Teklif ${q.quoteNo}`,
      Subject: 'Nakliye Teklif',
      Creator: brandName,
      Producer: brandName,
    },
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

  // ============== HEADER ==============
  // Sol ust: brand isim + tagline; sag ust: TEKLIF + numara/tarih kart
  doc
    .fillColor(brandColor)
    .font('Roboto-Bold')
    .fontSize(20)
    .text(brandName, margin, margin, { width: innerWidth / 2 });

  if (brandTagline) {
    doc
      .fillColor('#666')
      .font('Roboto')
      .fontSize(9)
      .text(brandTagline, margin, margin + 26, { width: innerWidth / 2 });
  }

  // Sag ust: TEKLIF basligi + meta (paneli ile)
  const metaX = pageWidth - margin - 200;
  const metaY = margin;
  doc
    .fillColor(brandColor)
    .font('Roboto-Bold')
    .fontSize(22)
    .text('TEKLIF', metaX, metaY, { align: 'right', width: 200 });

  doc
    .fillColor('#333')
    .font('Roboto-Bold')
    .fontSize(11)
    .text(q.quoteNo, metaX, metaY + 30, { align: 'right', width: 200 });

  doc
    .fillColor('#666')
    .font('Roboto')
    .fontSize(9)
    .text(`Teklif Tarihi: ${fmtDate(q.quoteDate)}`, metaX, metaY + 48, {
      align: 'right',
      width: 200,
    })
    .text(`Geçerlilik:  ${fmtDate(q.validityDate)}`, metaX, metaY + 60, {
      align: 'right',
      width: 200,
    });

  // Brand renk seperator
  const bandY = margin + 90;
  doc.moveTo(margin, bandY).lineTo(pageWidth - margin, bandY).strokeColor(brandColor).lineWidth(2).stroke();

  // ============== ALICI (Sayin ...) ==============
  let cursorY = bandY + 18;
  doc
    .fillColor('#666')
    .font('Roboto')
    .fontSize(9)
    .text('Sayın,', margin, cursorY);
  cursorY += 14;
  doc
    .fillColor('#111')
    .font('Roboto-Bold')
    .fontSize(13)
    .text(q.customer.companyName, margin, cursorY, { width: innerWidth });
  cursorY += 18;
  if (q.customer.contactName) {
    doc
      .fillColor('#555')
      .font('Roboto')
      .fontSize(10)
      .text(q.customer.contactName + ' (Yetkili)', margin, cursorY);
    cursorY += 14;
  }
  cursorY += 6;

  // Acilis paragrafi
  doc
    .fillColor('#333')
    .font('Roboto')
    .fontSize(10)
    .text(
      'Talep ettiğiniz hizmete ilişkin tarafımızca hazırlanan teklif aşağıda sunulmuştur. Detayları inceleyip dönüş yapmanız ricasıyla.',
      margin,
      cursorY,
      { width: innerWidth, lineGap: 2 },
    );
  cursorY += 38;

  // ============== HİZMET DETAYI Card ==============
  cursorY = drawSectionTitle(doc, 'Hizmet Detayı', margin, cursorY, innerWidth, brandColor);
  cursorY += 6;

  const rowH = 18;
  const labelCol = 130;
  const detailRows: Array<[string, string]> = [
    ['Taşıma Modu', transportLabel(q.transportMode)],
    ['Servis Tipi', q.serviceType || '-'],
    [
      'Güzergah',
      `${q.originCountry || '-'}${q.pol ? ' / ' + q.pol : ''}  →  ${q.destinationCountry || '-'}${q.pod ? ' / ' + q.pod : ''}`,
    ],
    ['Teslim Şekli (Incoterm)', q.incoterm || '-'],
  ];
  for (const [k, v] of detailRows) {
    doc.fillColor('#888').font('Roboto').fontSize(9).text(k, margin, cursorY, { width: labelCol });
    doc
      .fillColor('#111')
      .font('Roboto-Bold')
      .fontSize(10)
      .text(v, margin + labelCol, cursorY, { width: innerWidth - labelCol });
    cursorY += rowH;
  }
  cursorY += 8;

  // ============== FIYAT BLOCK ==============
  // Buyuk renkli kutu — fiyat one cikar
  const boxH = 72;
  doc
    .save()
    .fillColor(brandColor)
    .roundedRect(margin, cursorY, innerWidth, boxH, 8)
    .fill()
    .restore();
  doc
    .fillColor('#fff')
    .font('Roboto')
    .fontSize(10)
    .text('Toplam Teklif Tutarı', margin + 16, cursorY + 14);
  doc
    .fillColor('#fff')
    .font('Roboto-Bold')
    .fontSize(24)
    .text(fmtPrice(q.price, q.currency), margin + 16, cursorY + 30, {
      width: innerWidth - 32,
    });
  cursorY += boxH + 12;

  if (q.priceNote) {
    doc
      .fillColor('#666')
      .font('Roboto')
      .fontSize(9)
      .text('Fiyat Notu: ' + q.priceNote, margin, cursorY, {
        width: innerWidth,
        lineGap: 2,
      });
    cursorY += doc.heightOfString(q.priceNote, { width: innerWidth }) + 8;
  }

  // ============== MÜŞTERİ BİLGİLERİ Card ==============
  cursorY = drawSectionTitle(doc, 'Müşteri Bilgileri', margin, cursorY + 4, innerWidth, brandColor);
  cursorY += 6;

  const cust = q.customer;
  const custRows: Array<[string, string]> = [
    ['Firma', cust.companyName],
    ['Yetkili', cust.contactName || '-'],
    ['Vergi No / TCKN', cust.taxNumber || '-'],
    ['Vergi Dairesi', cust.taxOffice || '-'],
    ['Telefon', cust.phone || '-'],
    ['E-posta', cust.email || '-'],
    ['Adres', cust.address || '-'],
  ];
  for (const [k, v] of custRows) {
    doc.fillColor('#888').font('Roboto').fontSize(9).text(k, margin, cursorY, { width: labelCol });
    doc.font('Roboto-Bold').fontSize(10);
    const valHeight = doc.heightOfString(v, { width: innerWidth - labelCol });
    doc
      .fillColor('#111')
      .text(v, margin + labelCol, cursorY, { width: innerWidth - labelCol });
    cursorY += Math.max(rowH, valHeight + 4);
  }
  cursorY += 12;

  // ============== KOSULLAR ==============
  cursorY = drawSectionTitle(doc, 'Şartlar ve Koşullar', margin, cursorY, innerWidth, brandColor);
  cursorY += 6;

  const conditions = [
    `Bu teklif ${fmtDate(q.validityDate)} tarihine kadar geçerlidir.`,
    'Fiyatlar belirtilen güzergah ve hizmet kapsamı için hesaplanmıştır; rota değişikliği fiyatı etkileyebilir.',
    'Mücbir sebepler (gümrük gecikmesi, hava koşulları, navlun değişimi vb.) hariç tutulur.',
    'Yükleme ve gümrükleme süreçlerinde gerekli belge sorumluluğu müşteriye aittir.',
    'Teklif kabul edildiğinde sözleşme veya yazılı onay üzerinden sevkiyat süreci başlatılır.',
  ];
  for (const c of conditions) {
    doc
      .fillColor('#444')
      .font('Roboto')
      .fontSize(9)
      .text('• ' + c, margin, cursorY, { width: innerWidth, lineGap: 2 });
    cursorY += doc.heightOfString('• ' + c, { width: innerWidth }) + 4;
  }
  cursorY += 10;

  // ============== İMZA / İLETİŞİM ==============
  if (q.assignedUserName) {
    doc
      .fillColor('#888')
      .font('Roboto')
      .fontSize(9)
      .text('Hazırlayan', margin, cursorY);
    cursorY += 12;
    doc
      .fillColor('#111')
      .font('Roboto-Bold')
      .fontSize(11)
      .text(q.assignedUserName, margin, cursorY);
    cursorY += 14;
    doc
      .fillColor('#666')
      .font('Roboto')
      .fontSize(9)
      .text(emailFromName, margin, cursorY);
  }

  // ============== FOOTER ==============
  const footerY = 800;
  doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
  doc
    .fillColor('#888')
    .font('Roboto')
    .fontSize(8)
    .text(
      `${brandName}  ·  Bu belge otomatik olarak hazırlanmıştır  ·  ${new Date().toLocaleString('tr-TR')}`,
      margin,
      footerY + 6,
      { align: 'center', width: innerWidth },
    );

  doc.end();
  return done;
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number,
  width: number,
  brandColor: string,
): number {
  doc
    .fillColor(brandColor)
    .font('Roboto-Bold')
    .fontSize(11)
    .text(title.toUpperCase(), x, y, { width, characterSpacing: 0.6 });
  doc
    .moveTo(x, y + 16)
    .lineTo(x + width, y + 16)
    .strokeColor('#e6e6e6')
    .lineWidth(0.5)
    .stroke();
  return y + 18;
}
