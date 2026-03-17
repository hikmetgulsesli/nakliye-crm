/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/audit-logs/route';
import { prisma } from '@/lib/prisma';

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth/next';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Audit Logs API', () => {
  const mockAuditLog = {
    id: 'log-1',
    userId: 'user-1',
    action: 'CREATE',
    entityType: 'customer',
    entityId: 'cust-1',
    oldValues: null,
    newValues: { name: 'Test Customer' },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    user: {
      id: 'user-1',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      email: 'ahmet@nakliye-crm.com',
      avatarUrl: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/audit-logs', () => {
    it('should return audit logs for admin user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/audit-logs');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.logs).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should filter by action type', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/audit-logs?action=CREATE');
      await GET(request);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'CREATE',
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/audit-logs?dateFrom=2024-01-01&dateTo=2024-01-31');
      await GET(request);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            },
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(100);

      const request = new NextRequest('http://localhost/api/audit-logs?page=2&limit=25');
      const response = await GET(request);

      const data = await response.json();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(25);
      expect(data.pagination.totalPages).toBe(4);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25,
          take: 25,
        })
      );
    });

    it('should reject non-admin users', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', role: 'SALES_REP' },
      });

      const request = new NextRequest('http://localhost/api/audit-logs');
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/audit-logs');
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should filter by entity type', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/audit-logs?entityType=quotation');
      await GET(request);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'quotation',
          }),
        })
      );
    });

    it('should include user information with logs', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
      });

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/audit-logs');
      const response = await GET(request);

      const data = await response.json();
      expect(data.logs[0].user).toBeDefined();
      expect(data.logs[0].user.firstName).toBe('Ahmet');
    });
  });
});
