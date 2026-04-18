import { aiChat } from '../index';
import type { AIMessage } from '@nakliye-crm/shared';

export interface DraftQuoteEmailInput {
  language: 'tr' | 'en';
  tone: 'formal' | 'friendly' | 'concise';
  customerName: string;
  companyName: string;
  quoteNo: string;
  quoteDate: string;
  validityDate: string;
  transportMode?: string;
  serviceType?: string;
  originCountry?: string;
  pol?: string;
  destinationCountry?: string;
  pod?: string;
  incoterm?: string;
  price: number;
  currency: string;
  priceNote?: string;
  senderName: string;
  extraInstructions?: string;
  userId?: number;
}

const SYSTEM_TR = `Sen uluslararası nakliye sektöründe çalışan deneyimli bir satış temsilcisin.
Müşterilere profesyonel, nazik ve net teklif e-postaları yazıyorsun.
Kurallar:
- Türkçe, resmî ama samimi dil kullan
- Fiyat, güzergâh, geçerlilik tarihi gibi temel bilgileri vurgula
- Incoterm, POL/POD, taşıma modu gibi terimleri kullan ama teknik detaylarla boğma
- Kısa ve okunaklı paragraflar
- E-posta başına selam + tanıtım, ortada detaylar, sonda CTA (onay bekleme)
- Çıktında sadece e-posta metni olsun. "İşte taslak:" gibi açıklama yazma
- İmza olarak sadece isim yaz, şirket/ünvan ekleme (sistem ekleyecek)`;

const SYSTEM_EN = `You are an experienced sales rep in international shipping/freight forwarding.
You write professional, polite and clear quotation emails to customers.
Rules:
- English, formal-but-warm
- Highlight price, route, validity
- Use trade terms (Incoterm, POL/POD, mode) but don't drown the reader
- Short readable paragraphs
- Opening: greeting + brief intro, middle: details, end: CTA (awaiting confirmation)
- Output ONLY the email body. Do not prefix with "Here is the draft:" or similar
- Signature: just the name, no company/title (system will add)`;

export async function draftQuoteEmail(input: DraftQuoteEmailInput): Promise<string> {
  const system = input.language === 'tr' ? SYSTEM_TR : SYSTEM_EN;
  const toneNote =
    input.tone === 'formal'
      ? input.language === 'tr'
        ? 'Çok resmî bir ton kullan.'
        : 'Use a very formal tone.'
      : input.tone === 'friendly'
        ? input.language === 'tr'
          ? 'Samimi ama profesyonel bir ton kullan.'
          : 'Use a warm yet professional tone.'
        : input.language === 'tr'
          ? 'Mümkün olduğunca kısa tut, 4-6 cümleyi geçme.'
          : 'Keep it very short, max 4-6 sentences.';

  const userPrompt = [
    `${toneNote}`,
    '',
    `Müşteri: ${input.companyName} — ${input.customerName}`,
    `Teklif No: ${input.quoteNo}`,
    `Teklif Tarihi: ${input.quoteDate}`,
    `Geçerlilik: ${input.validityDate}`,
    input.transportMode ? `Taşıma Modu: ${input.transportMode}` : '',
    input.serviceType ? `Servis Tipi: ${input.serviceType}` : '',
    input.originCountry || input.pol
      ? `Çıkış: ${[input.originCountry, input.pol].filter(Boolean).join(' / ')}`
      : '',
    input.destinationCountry || input.pod
      ? `Varış: ${[input.destinationCountry, input.pod].filter(Boolean).join(' / ')}`
      : '',
    input.incoterm ? `Incoterm: ${input.incoterm}` : '',
    `Fiyat: ${input.price} ${input.currency}`,
    input.priceNote ? `Fiyat Notu: ${input.priceNote}` : '',
    `Gönderen: ${input.senderName}`,
    input.extraInstructions ? `\nEkstra talimat: ${input.extraInstructions}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const messages: AIMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: userPrompt },
  ];

  const result = await aiChat(messages, {
    task: 'draft-email',
    userId: input.userId,
    temperature: 0.7,
    maxTokens: 1000,
  });

  return result.text.trim();
}
