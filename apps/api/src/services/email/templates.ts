/**
 * Basit HTML e-posta template'leri. Inline CSS, responsive, Türkçe UTF-8.
 * React Email gibi ağır bir kütüphane eklemiyoruz — 4 template için abartı olur.
 */

function layout(body: string, opts: { title: string; footerUrl?: string }): string {
  const brand = 'Nakliye CRM';
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(opts.title)}</title>
</head>
<body style="margin:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.05)">
      <div style="border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:8px;background:#e30a17;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px">🚛</div>
          <strong style="font-size:18px;color:#0f172a">${brand}</strong>
        </div>
      </div>
      ${body}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px">
        Bu e-posta ${brand} tarafından otomatik olarak gönderildi.
        ${opts.footerUrl ? `<br><a href="${escape(opts.footerUrl)}" style="color:#e30a17">CRM'e git</a>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escape(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------- Templates ----------------

export interface DailyDigestData {
  recipientName: string;
  date: string;
  uncontactedCount: number;
  pendingQuoteCount: number;
  expiredQuoteCount: number;
  baseUrl: string;
}

export function dailyDigestTemplate(d: DailyDigestData): { subject: string; html: string } {
  const total = d.uncontactedCount + d.pendingQuoteCount + d.expiredQuoteCount;
  const body = `
    <h1 style="font-size:20px;margin:0 0 8px 0">Günlük Özet — ${escape(d.date)}</h1>
    <p style="color:#334155;line-height:1.6">
      Merhaba <strong>${escape(d.recipientName)}</strong>, bugün dikkat etmeniz gereken
      <strong>${total}</strong> madde var.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:16px">
      <tr><td style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#fef3c7">
        <div style="font-size:12px;color:#92400e;text-transform:uppercase">Aranmayan Müşteri</div>
        <div style="font-size:28px;font-weight:700;color:#78350f">${d.uncontactedCount}</div>
      </td></tr>
      <tr><td style="height:8px"></td></tr>
      <tr><td style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#dbeafe">
        <div style="font-size:12px;color:#1e40af;text-transform:uppercase">Bekleyen Teklif</div>
        <div style="font-size:28px;font-weight:700;color:#1e3a8a">${d.pendingQuoteCount}</div>
      </td></tr>
      <tr><td style="height:8px"></td></tr>
      <tr><td style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#fee2e2">
        <div style="font-size:12px;color:#991b1b;text-transform:uppercase">Süresi Dolan Teklif</div>
        <div style="font-size:28px;font-weight:700;color:#7f1d1d">${d.expiredQuoteCount}</div>
      </td></tr>
    </table>
    <div style="margin-top:24px">
      <a href="${escape(d.baseUrl)}" style="display:inline-block;padding:12px 24px;background:#e30a17;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Dashboard'u Aç</a>
    </div>
  `;
  return {
    subject: `[Nakliye CRM] Günlük Özet — ${d.date} (${total} madde)`,
    html: layout(body, { title: 'Günlük Özet', footerUrl: d.baseUrl }),
  };
}

export interface QuotationEmailData {
  customerName: string;
  companyName: string;
  quoteNo: string;
  messageBody: string; // AI tarafindan uretilen veya kullanici duzenledigi icerik
  senderName: string;
  senderEmail: string;
  baseUrl?: string;
}

export function quotationEmailTemplate(d: QuotationEmailData): { subject: string; html: string } {
  // messageBody is user-authored/AI-generated; treat as pre-formatted text, convert newlines.
  const bodyHtml = escape(d.messageBody).replace(/\n/g, '<br>');
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;line-height:1.6;max-width:640px;margin:24px auto;padding:0 16px">
  <div>${bodyHtml}</div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px">
    <strong>${escape(d.senderName)}</strong><br>
    ${escape(d.senderEmail)}
  </div>
</body></html>`;
  return {
    subject: `Teklif ${d.quoteNo} — ${d.companyName}`,
    html,
  };
}

export interface CriticalAlertData {
  recipientName: string;
  alertTitle: string;
  alertMessage: string;
  link?: string;
  baseUrl: string;
}

export function criticalAlertTemplate(d: CriticalAlertData): { subject: string; html: string } {
  const body = `
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:8px;margin-bottom:16px">
      <strong style="color:#991b1b">⚠️ Kritik Uyarı</strong>
    </div>
    <h1 style="font-size:18px;margin:0 0 8px 0">${escape(d.alertTitle)}</h1>
    <p style="color:#334155">Merhaba ${escape(d.recipientName)},</p>
    <p style="color:#334155;line-height:1.6">${escape(d.alertMessage)}</p>
    ${d.link ? `<div style="margin-top:24px"><a href="${escape(d.baseUrl + d.link)}" style="display:inline-block;padding:10px 20px;background:#e30a17;color:#fff;border-radius:8px;text-decoration:none">Detaya Git</a></div>` : ''}
  `;
  return {
    subject: `[Nakliye CRM] ${d.alertTitle}`,
    html: layout(body, { title: d.alertTitle, footerUrl: d.baseUrl }),
  };
}

export interface PasswordResetData {
  recipientName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function passwordResetTemplate(d: PasswordResetData): { subject: string; html: string } {
  const body = `
    <h1 style="font-size:20px;margin:0 0 16px 0">Şifre Sıfırlama</h1>
    <p style="color:#334155;line-height:1.6">
      Merhaba ${escape(d.recipientName)},<br>
      Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bağlantı
      <strong>${d.expiresInMinutes} dakika</strong> geçerlidir.
    </p>
    <div style="margin:24px 0">
      <a href="${escape(d.resetUrl)}" style="display:inline-block;padding:12px 32px;background:#e30a17;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Şifremi Sıfırla</a>
    </div>
    <p style="color:#64748b;font-size:13px">
      Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
    </p>
  `;
  return {
    subject: '[Nakliye CRM] Şifre Sıfırlama',
    html: layout(body, { title: 'Şifre Sıfırlama' }),
  };
}

export interface TestEmailData {
  recipientName: string;
  triggeredBy: string;
  baseUrl: string;
}

export function testEmailTemplate(d: TestEmailData): { subject: string; html: string } {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px 0">✅ Test E-postası</h1>
    <p style="color:#334155;line-height:1.6">
      Merhaba ${escape(d.recipientName)},<br>
      Bu bir test e-postasıdır — gönderim yapılandırmanız çalışıyor.
    </p>
    <p style="color:#64748b;font-size:13px">
      Tetikleyen: ${escape(d.triggeredBy)}<br>
      Zaman: ${new Date().toLocaleString('tr-TR')}
    </p>
  `;
  return {
    subject: '[Nakliye CRM] Test E-postası',
    html: layout(body, { title: 'Test', footerUrl: d.baseUrl }),
  };
}
