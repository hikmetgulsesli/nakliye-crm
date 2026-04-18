import api from '@/config/api';

export const aiService = {
  async status(): Promise<{ provider: string | null; defaultModel: string | null; error?: string }> {
    const { data } = await api.get('/ai/status');
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
