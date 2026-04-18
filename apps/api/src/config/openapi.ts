/**
 * Minimal OpenAPI 3.0 spec. Endpoint kapsami artacak — simdilik core.
 * Swagger UI: /api/docs
 */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Nakliye CRM API',
    version: '3.0.0',
    description:
      'Uluslararası nakliye CRM — müşteri, teklif, sevkiyat, rapor, AI, kanal API.',
  },
  servers: [
    { url: 'http://localhost:4100/api', description: 'Local' },
    { url: 'https://nakliye.setrox.com.tr/api', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'Saglik kontrolü',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Giriş',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'accessToken + user' } },
      },
    },
    '/customers': {
      get: { summary: 'Müşteri listesi' },
      post: { summary: 'Müşteri oluştur' },
    },
    '/customers/conflict-check': {
      post: { summary: 'Çakışma önizleme (ad/tel/e-posta)' },
    },
    '/quotations': {
      get: { summary: 'Teklif listesi' },
      post: { summary: 'Teklif oluştur' },
    },
    '/shipments': {
      get: { summary: 'Sevkiyat listesi' },
      post: { summary: 'Sevkiyat oluştur' },
    },
    '/shipments/{id}/status': {
      post: { summary: 'Sevkiyat durumu değiştir (state machine)' },
    },
    '/documents/request-upload': {
      post: { summary: 'Doküman için presigned upload URL al' },
    },
    '/ai/quotations/{quotationId}/draft-email': {
      post: { summary: 'AI teklif e-posta taslağı (Claude/OpenAI/MiniMax/Kimi)' },
    },
    '/ai/quotations/{quotationId}/win-probability': {
      get: { summary: 'Kazanma ihtimali skoru (heuristic)' },
    },
    '/ai/churn-risk': {
      get: { summary: 'Risk altındaki müşteriler' },
    },
    '/ai/coaching/{userId}': {
      get: { summary: 'Personel koçluk önerileri' },
    },
    '/exchange-rates/latest': {
      get: { summary: 'Güncel TCMB kurları (USD/EUR/GBP/CHF/JPY/CNY)' },
    },
    '/search': {
      get: {
        summary: 'Global arama (customer/quotation/shipment/activity)',
        parameters: [{ in: 'query', name: 'q', required: true, schema: { type: 'string' } }],
      },
    },
    '/portal/auth/request-otp': {
      post: { summary: 'Müşteri portal OTP iste', security: [] },
    },
    '/settings': {
      get: { summary: 'Sistem ayarlarını getir (admin)' },
      patch: { summary: 'Tek ayar güncelle (admin)' },
    },
  },
};
