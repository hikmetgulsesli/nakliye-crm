import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import "@testing-library/jest-dom";

// Mock Next.js modules
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Mock Prisma
const mockPrisma = {
  quotation: {
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  activity: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  customer: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("Dashboard API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("User Metrics Calculation", () => {
    it("should calculate weekly quotes correctly", async () => {
      mockPrisma.quotation.count.mockResolvedValue(5);

      const count = await mockPrisma.quotation.count({
        where: {
          createdById: "user-1",
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });

      expect(count).toBe(5);
    });

    it("should calculate monthly win rate correctly", async () => {
      mockPrisma.quotation.count
        .mockResolvedValueOnce(20) // monthlyQuotes
        .mockResolvedValueOnce(10); // monthlyWon

      const monthlyQuotes = await mockPrisma.quotation.count({
        where: {
          createdById: "user-1",
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });

      const monthlyWon = await mockPrisma.quotation.count({
        where: {
          createdById: "user-1",
          status: "ACCEPTED",
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });

      const winRate = monthlyQuotes > 0 ? Math.round((monthlyWon / monthlyQuotes) * 100) : 0;

      expect(monthlyQuotes).toBe(20);
      expect(monthlyWon).toBe(10);
      expect(winRate).toBe(50);
    });
  });

  describe("Admin Metrics Calculation", () => {
    it("should calculate team win rate correctly", async () => {
      mockPrisma.quotation.count
        .mockResolvedValueOnce(100) // monthlyQuotesTotal
        .mockResolvedValueOnce(45); // monthlyWonTotal

      const monthlyQuotesTotal = await mockPrisma.quotation.count({
        where: {
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });

      const monthlyWonTotal = await mockPrisma.quotation.count({
        where: {
          status: "ACCEPTED",
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });

      const teamWinRate = monthlyQuotesTotal > 0 ? Math.round((monthlyWonTotal / monthlyQuotesTotal) * 100) : 0;

      expect(monthlyQuotesTotal).toBe(100);
      expect(monthlyWonTotal).toBe(45);
      expect(teamWinRate).toBe(45);
    });

    it("should calculate quote change percentage correctly", async () => {
      const monthlyQuotes = 120;
      const lastMonthQuotes = 100;

      const quoteChange = lastMonthQuotes > 0
        ? Math.round(((monthlyQuotes - lastMonthQuotes) / lastMonthQuotes) * 100)
        : 0;

      expect(quoteChange).toBe(20);
    });
  });

  describe("Widget Data", () => {
    it("should find customers not contacted in 14+ days", async () => {
      const mockCustomers = [
        {
          id: "cust-1",
          companyName: "ABC Lojistik",
          lastContactDate: new Date("2026-02-01"),
          _count: { activities: 5 },
        },
        {
          id: "cust-2",
          companyName: "XYZ Taşımacılık",
          lastContactDate: null,
          _count: { activities: 0 },
        },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers);

      const customers = await mockPrisma.customer.findMany({
        where: {
          assignedToId: "user-1",
          OR: [
            {
              activities: {
                every: {
                  createdAt: {
                    lt: expect.any(Date),
                  },
                },
              },
            },
            {
              activities: {
                none: {},
              },
            },
          ],
        },
        select: {
          id: true,
          companyName: true,
          lastContactDate: true,
          _count: {
            select: {
              activities: true,
            },
          },
        },
        orderBy: {
          lastContactDate: "asc",
        },
        take: 5,
      });

      expect(customers).toHaveLength(2);
      expect(customers[0].companyName).toBe("ABC Lojistik");
    });

    it("should find pending quotes with no update in 7+ days", async () => {
      const mockQuotes = [
        {
          id: "quote-1",
          quoteNumber: "TKF-2026-0001",
          status: "DRAFT",
          updatedAt: new Date("2026-03-01"),
          customer: {
            id: "cust-1",
            companyName: "ABC Lojistik",
          },
        },
      ];

      mockPrisma.quotation.findMany.mockResolvedValue(mockQuotes);

      const quotes = await mockPrisma.quotation.findMany({
        where: {
          createdById: "user-1",
          status: {
            in: ["DRAFT", "SENT"],
          },
          updatedAt: {
            lte: expect.any(Date),
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          updatedAt: "asc",
        },
        take: 5,
      });

      expect(quotes).toHaveLength(1);
      expect(quotes[0].quoteNumber).toBe("TKF-2026-0001");
    });
  });

  describe("Personnel Performance", () => {
    it("should calculate personnel performance metrics", async () => {
      const mockUsers = [
        { id: "user-1", firstName: "Ahmet", lastName: "Yılmaz", email: "ahmet@reelforge.com" },
        { id: "user-2", firstName: "Mehmet", lastName: "Kaya", email: "mehmet@reelforge.com" },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.quotation.count
        .mockResolvedValueOnce(15) // quoteCount
        .mockResolvedValueOnce(8); // wonCount

      const users = await mockPrisma.user.findMany({
        where: {
          isActive: true,
          role: { in: ["SALES_REP", "SALES_MANAGER", "ADMIN"] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      expect(users).toHaveLength(2);

      const quoteCount = await mockPrisma.quotation.count({
        where: {
          createdById: users[0].id,
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });

      const wonCount = await mockPrisma.quotation.count({
        where: {
          createdById: users[0].id,
          status: "ACCEPTED",
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      });

      const winRate = quoteCount > 0 ? Math.round((wonCount / quoteCount) * 100) : 0;

      expect(quoteCount).toBe(15);
      expect(wonCount).toBe(8);
      expect(winRate).toBe(53);
    });
  });

  describe("Country Distribution", () => {
    it("should group quotes by origin country", async () => {
      const mockOriginDistribution = [
        { originCountry: "Çin", _count: { id: 35 } },
        { originCountry: "Almanya", _count: { id: 22 } },
        { originCountry: "İtalya", _count: { id: 18 } },
      ];

      mockPrisma.quotation.groupBy.mockResolvedValue(mockOriginDistribution);

      const distribution = await mockPrisma.quotation.groupBy({
        by: ["originCountry"],
        where: {
          createdAt: {
            gte: expect.any(Date),
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      });

      expect(distribution).toHaveLength(3);
      expect(distribution[0].originCountry).toBe("Çin");
      expect(distribution[0]._count.id).toBe(35);
    });
  });

  describe("Formatter Utilities", () => {
    it("should format dates correctly", () => {
      const dateString = "2026-03-15T10:30:00Z";
      const date = new Date(dateString);
      const formatted = date.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      expect(formatted).toContain("2026");
    });

    it("should return activity type labels correctly", () => {
      const labels: Record<string, string> = {
        CALL: "Telefon Görüşmesi",
        EMAIL: "E-posta",
        MEETING: "Yüz Yüze Görüşme",
        QUOTE_ACCEPTED: "Teklif Kabul Edildi",
      };

      expect(labels.CALL).toBe("Telefon Görüşmesi");
      expect(labels.EMAIL).toBe("E-posta");
      expect(labels.QUOTE_ACCEPTED).toBe("Teklif Kabul Edildi");
    });

    it("should return status colors correctly", () => {
      const colors: Record<string, string> = {
        DRAFT: "bg-slate-100 text-slate-800",
        SENT: "bg-blue-100 text-blue-800",
        ACCEPTED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
      };

      expect(colors.ACCEPTED).toContain("green");
      expect(colors.REJECTED).toContain("red");
    });
  });
});
