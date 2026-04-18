import api from '@/config/api';

export const emailsService = {
  async sendTest(): Promise<{ provider: string; messageId?: string }> {
    const { data } = await api.post('/emails/test');
    return data;
  },

  async sendDailyDigest(): Promise<{ queued: number; recipients: number[] }> {
    const { data } = await api.post('/emails/daily-digest');
    return data;
  },

  async sendQuotationEmail(
    quotationId: number,
    payload: { messageBody: string; recipientEmail?: string; cc?: string[] },
  ): Promise<{ provider: string; messageId?: string }> {
    const { data } = await api.post(`/emails/quotations/${quotationId}/send`, payload);
    return data;
  },
};
