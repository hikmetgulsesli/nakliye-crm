import { create } from 'zustand';
import api from '../config/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string | null;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Socket.IO 'notification:new' geldiginde cagrilir; ust uste eklenir, sayac artar. */
  pushFromSocket: (n: Notification) => void;
}

export const useNotificationStore = create<NotificationState>()((set, _get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  pushFromSocket: (n: Notification) => {
    set((state) => {
      // Ayni id zaten varsa tekrar ekleme (cift emit/refresh durumu)
      if (state.notifications.some((x) => x.id === n.id)) return state;
      return {
        notifications: [n, ...state.notifications].slice(0, 100),
        unreadCount: state.unreadCount + (n.isRead ? 0 : 1),
      };
    });
  },

  fetch: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<{
        success: boolean;
        data: Notification[];
        unreadCount?: number;
      }>('/notifications');
      const list = Array.isArray(data?.data) ? data.data : [];
      const unreadCount =
        typeof data?.unreadCount === 'number'
          ? data.unreadCount
          : list.filter((n) => !n.isRead).length;
      set({ notifications: list, unreadCount });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },
}));
