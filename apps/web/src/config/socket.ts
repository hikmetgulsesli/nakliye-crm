import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';

let socket: Socket | null = null;
let lastToken: string | null = null;
let subscribed = false;

interface RawNotification {
  id: number | string;
  title: string;
  message: string;
  type: string;
  isRead?: boolean;
  createdAt: string;
  link?: string | null;
}

function normalize(raw: RawNotification): Notification {
  const t = (raw.type ?? 'info') as Notification['type'];
  return {
    id: String(raw.id),
    title: raw.title,
    message: raw.message,
    type: ['info', 'warning', 'success', 'error'].includes(t) ? t : 'info',
    isRead: !!raw.isRead,
    createdAt: raw.createdAt,
    link: raw.link ?? null,
  };
}

function connect(token: string) {
  if (socket && lastToken === token) return;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  lastToken = token;

  socket = io({
    path: '/api/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('notification:new', (payload: RawNotification) => {
    if (!payload?.id) return;
    useNotificationStore.getState().pushFromSocket(normalize(payload));
  });

  socket.on('connect_error', (err) => {
    // Auth hatasi olursa logout sirasinda sessiz dussun; gercek hatalari konsola dusur
    if (err.message !== 'Auth token gerekli' && err.message !== 'Geçersiz token') {
      console.warn('[socket] baglanti hatasi:', err.message);
    }
  });
}

function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastToken = null;
  }
}

/**
 * Auth token'a abone ol; login → connect, logout → disconnect.
 * App boot'ta tek bir kere main.tsx veya AppLayout'tan cagrilir.
 */
export function initRealtime() {
  const initial = useAuthStore.getState().accessToken;
  if (initial) connect(initial);
  if (subscribed) return;
  subscribed = true;

  useAuthStore.subscribe((state, prev) => {
    if (state.accessToken === prev.accessToken) return;
    if (state.accessToken) connect(state.accessToken);
    else disconnect();
  });
}

export function getSocket(): Socket | null {
  return socket;
}
