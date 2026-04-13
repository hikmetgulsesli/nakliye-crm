import api from '@/config/api';
import type { Notification } from '@/stores/notificationStore';

export interface NotificationPreferences {
  emailNotifications: boolean;
  dailySummary: boolean;
  criticalAlerts: boolean;
}

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>('/notifications');
    return data;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const { data } = await api.get<NotificationPreferences>('/notifications/preferences');
    return data;
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data } = await api.put<NotificationPreferences>('/notifications/preferences', prefs);
    return data;
  },
};
