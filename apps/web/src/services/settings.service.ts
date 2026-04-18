import api from '@/config/api';

export interface AIProviderStatus {
  name: 'claude' | 'openai' | 'minimax' | 'kimi';
  configured: boolean;
  defaultModel: string;
}

export interface IntegrationsStatus {
  sentry: { backend: boolean };
  redis: { configured: boolean };
  storage: {
    configured: boolean;
    endpoint: string | null;
    bucket: string | null;
  };
  email: { resendConfigured: boolean; smtpConfigured: boolean };
  whatsapp: { twilioConfigured: boolean };
  sms: { netgsmConfigured: boolean };
}

export interface SettingsResponse {
  settings: Record<string, unknown>;
  integrations: IntegrationsStatus;
  aiProviders: AIProviderStatus[];
}

export interface AIUsageReport {
  since: string;
  totals: { calls: number; tokens: number; costUsd: number };
  byProvider: Array<{
    provider: string;
    _sum: { totalTokens: number | null; costUsd: number | null };
    _count: { _all: number };
  }>;
  byTask: Array<{
    task: string | null;
    _sum: { totalTokens: number | null; costUsd: number | null };
    _count: { _all: number };
  }>;
  recent: Array<{
    id: number;
    provider: string;
    model: string;
    task: string | null;
    userId: number | null;
    totalTokens: number;
    costUsd: number;
    latencyMs: number;
    success: boolean;
    createdAt: string;
  }>;
}

export const settingsService = {
  async getAll(): Promise<SettingsResponse> {
    const { data } = await api.get<SettingsResponse>('/settings');
    return data;
  },

  async update(key: string, value: unknown): Promise<void> {
    await api.patch('/settings', { key, value });
  },

  async aiUsage(days = 30): Promise<AIUsageReport> {
    const { data } = await api.get<AIUsageReport>(`/settings/ai-usage?days=${days}`);
    return data;
  },
};
