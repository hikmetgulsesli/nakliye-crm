import api from '@/config/api';

export interface TransferPreviewRequest {
  fromUserId: number;
  toUserId: number;
  scope: 'all' | 'active_customers' | 'open_quotes';
}

export interface TransferPreview {
  sourceUser: { id: number; fullName: string };
  targetUser: { id: number; fullName: string };
  affectedRecords: {
    customers: number;
    quotations: number;
    activities: number;
    total: number;
  };
}

export interface TransferResult {
  sourceUser: { id: number; fullName: string };
  targetUser: { id: number; fullName: string };
  transferred: {
    customers: number;
    quotations: number;
    activities: number;
  };
}

export interface TransferHistoryItem {
  id: number;
  fromUser: { id: number; fullName: string };
  toUser: { id: number; fullName: string };
  scope: string;
  customerCount: number;
  quoteCount: number;
  activityCount: number;
  createdAt: string;
  createdBy: { id: number; fullName: string };
}

export const transferService = {
  async preview(input: TransferPreviewRequest): Promise<TransferPreview> {
    const { data } = await api.post<TransferPreview>('/transfers/preview', input);
    return data;
  },

  async execute(input: TransferPreviewRequest): Promise<TransferResult> {
    const { data } = await api.post<TransferResult>('/transfers/execute', input);
    return data;
  },

  async getHistory(page: number = 1, pageSize: number = 20) {
    const { data } = await api.get('/transfers/history', {
      params: { page, pageSize },
    });
    return data;
  },
};
