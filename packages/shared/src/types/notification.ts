export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}
