import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { env } from '../config/env';

let io: SocketIOServer | null = null;

interface AuthedPayload {
  userId: number;
  role: 'ADMIN' | 'USER';
  email: string;
}

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
    path: '/api/socket.io',
  });

  // Auth middleware — client handshake.auth.token ile JWT gonderir
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Auth token gerekli'));
    try {
      const payload = jwt.verify(token, env.jwtSecret) as AuthedPayload;
      (socket.data as { user: AuthedPayload }).user = payload;
      // Kullaniciyi kendi odasina ekle
      socket.join(`user:${payload.userId}`);
      if (payload.role === 'ADMIN') socket.join('admins');
      next();
    } catch {
      next(new Error('Geçersiz token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket.data as { user: AuthedPayload }).user;
    logger.debug({ userId: user.userId, socketId: socket.id }, 'Socket baglandi');

    socket.on('disconnect', () => {
      logger.debug({ userId: user.userId, socketId: socket.id }, 'Socket ayrildi');
    });
  });

  logger.info('Socket.IO baslatildi (/api/socket.io)');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Belirli bir kullaniciya event gonder.
 */
export function emitToUser(userId: number, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

/**
 * Tum admin'lere event gonder.
 */
export function emitToAdmins(event: string, payload: unknown) {
  io?.to('admins').emit(event, payload);
}

/**
 * Tum bagli kullanicilara yayin.
 */
export function broadcast(event: string, payload: unknown) {
  io?.emit(event, payload);
}
