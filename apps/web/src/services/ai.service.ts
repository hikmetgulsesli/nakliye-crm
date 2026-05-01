import api from '@/config/api';

export const aiService = {
  async status(): Promise<{ provider: string | null; defaultModel: string | null; error?: string }> {
    const { data } = await api.get('/ai/status');
    return data;
  },

  /**
   * Yapilandirilmis sagleyici ile gercekten cagrilanabilir mi diye test eder.
   * Tek tur kisa prompt gonderir; donen 'pong' veya benzer kisa cevap.
   */
  async testConnection(): Promise<{
    ok: boolean;
    provider?: string;
    model?: string;
    latencyMs?: number;
    error?: string;
  }> {
    const t0 = performance.now();
    try {
      const { data } = await api.post('/ai/chat', {
        messages: [
          { role: 'system', content: 'Reply with a single word: pong' },
          { role: 'user', content: 'ping' },
        ],
        maxTokens: 10,
        temperature: 0,
      });
      const latencyMs = Math.round(performance.now() - t0);
      return {
        ok: true,
        provider: data?.provider,
        model: data?.model,
        latencyMs,
      };
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return {
        ok: false,
        error: error.response?.data?.message ?? error.message ?? 'Bilinmeyen hata',
      };
    }
  },

  async smartQueue(): Promise<Array<{
    customerId: number;
    companyName: string;
    phone: string;
    priority: number;
    reasons: string[];
    lastContactDate: string | null;
    openQuoteCount: number;
  }>> {
    const { data } = await api.get('/ai/smart-queue');
    return data;
  },

  async customerSummary(customerId: number): Promise<{
    context: {
      customer: {
        name: string;
        contactName: string | null;
        potential: string | null;
        status: string;
        lastContactDate: string | null;
      };
      metrics: {
        totalQuotes: number;
        wonQuotes: number;
        lostQuotes: number;
        pendingQuotes: number;
        wonValue: Record<string, number>;
        activeShipments: number;
        activitiesLast90d: number;
      };
    };
    summary: string;
  }> {
    const { data } = await api.get(`/ai/customers/${customerId}/summary`);
    return data;
  },

  async winProbability(quotationId: number): Promise<{
    quotationId: number;
    probability: number;
    confidence: 'low' | 'medium' | 'high';
    signals: Array<{ name: string; impact: number; detail: string }>;
  }> {
    const { data } = await api.get(`/ai/quotations/${quotationId}/win-probability`);
    return data;
  },

  async draftQuoteEmail(
    quotationId: number,
    payload: {
      language?: 'tr' | 'en';
      tone?: 'formal' | 'friendly' | 'concise';
      extraInstructions?: string;
    },
  ): Promise<{ draft: string }> {
    const { data } = await api.post<{ draft: string }>(
      `/ai/quotations/${quotationId}/draft-email`,
      payload,
    );
    return data;
  },
};
