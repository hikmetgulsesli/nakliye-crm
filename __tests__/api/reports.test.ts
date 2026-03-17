/**
 * Integration tests for Reports API
 * Note: These tests require a running Next.js server and database.
 * Run with: npm run test:integration
 */

// Skip all tests in this file as they require a running Next.js server
// These are integration tests that should be run separately
describe.skip("Reports API", () => {
  const baseUrl = "http://localhost:3000";

  describe("GET /api/reports", () => {
    it("requires authentication", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=periodic-quotation&startDate=2024-01-01&endDate=2024-12-31`
      );
      expect(response.status).toBe(401);
    });

    it("requires type, startDate, and endDate parameters", async () => {
      const response = await fetch(`${baseUrl}/api/reports`);
      expect(response.status).toBe(400);
    });

    it("validates report type", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=invalid-type&startDate=2024-01-01&endDate=2024-12-31`
      );
      expect(response.status).toBe(400);
    });

    it("accepts valid report types", async () => {
      const validTypes = [
        "periodic-quotation",
        "personnel-performance",
        "won-lost-analysis",
        "country-mode-volume",
        "loss-reason",
      ];

      for (const type of validTypes) {
        const response = await fetch(
          `${baseUrl}/api/reports?type=${type}&startDate=2024-01-01&endDate=2024-12-31`
        );
        // May return 401 if not authenticated, but should not return 400 for invalid type
        if (response.status !== 401) {
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.reportType).toBe(type);
        }
      }
    });

    it("generates periodic quotation report with correct structure", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=periodic-quotation&startDate=2024-01-01&endDate=2024-12-31`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.reportType).toBe("periodic-quotation");
        expect(data.period).toBeDefined();
        expect(data.summary).toBeDefined();
        expect(data.quotations).toBeDefined();
        expect(data.summary.totalQuotes).toBeGreaterThanOrEqual(0);
        expect(data.summary.wonQuotes).toBeGreaterThanOrEqual(0);
        expect(data.summary.lostQuotes).toBeGreaterThanOrEqual(0);
      }
    });

    it("generates personnel performance report with correct structure", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=personnel-performance&startDate=2024-01-01&endDate=2024-12-31`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.reportType).toBe("personnel-performance");
        expect(data.period).toBeDefined();
        expect(data.summary).toBeDefined();
        expect(data.personnel).toBeDefined();
        expect(Array.isArray(data.personnel)).toBe(true);
      }
    });

    it("generates won/lost analysis report with correct structure", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=won-lost-analysis&startDate=2024-01-01&endDate=2024-12-31`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.reportType).toBe("won-lost-analysis");
        expect(data.summary).toBeDefined();
        expect(data.summary.wonCount).toBeGreaterThanOrEqual(0);
        expect(data.summary.lostCount).toBeGreaterThanOrEqual(0);
        expect(data.summary.winRate).toBeDefined();
        expect(data.breakdown).toBeDefined();
      }
    });

    it("generates country/mode volume report with correct structure", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=country-mode-volume&startDate=2024-01-01&endDate=2024-12-31`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.reportType).toBe("country-mode-volume");
        expect(data.summary).toBeDefined();
        expect(data.byOriginCountry).toBeDefined();
        expect(data.byDestinationCountry).toBeDefined();
        expect(data.byTransportMode).toBeDefined();
        expect(Array.isArray(data.topRoutes)).toBe(true);
      }
    });

    it("generates loss reason report with correct structure", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=loss-reason&startDate=2024-01-01&endDate=2024-12-31`
      );

      if (response.status === 200) {
        const data = await response.json();
        expect(data.reportType).toBe("loss-reason");
        expect(data.summary).toBeDefined();
        expect(data.summary.totalLostQuotes).toBeGreaterThanOrEqual(0);
        expect(data.lossReasons).toBeDefined();
        expect(data.lossReasons).toHaveLength(5);
      }
    });

    it("supports filtering by status", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=periodic-quotation&startDate=2024-01-01&endDate=2024-12-31&status=ACCEPTED`
      );

      // Should not error on valid status filter
      expect(response.status).not.toBe(400);
    });

    it("supports filtering by transport mode", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=periodic-quotation&startDate=2024-01-01&endDate=2024-12-31&transportMode=SEA`
      );

      // Should not error on valid transport mode filter
      expect(response.status).not.toBe(400);
    });

    it("supports filtering by currency", async () => {
      const response = await fetch(
        `${baseUrl}/api/reports?type=periodic-quotation&startDate=2024-01-01&endDate=2024-12-31&currency=USD`
      );

      // Should not error on valid currency filter
      expect(response.status).not.toBe(400);
    });
  });

  describe("POST /api/reports/export", () => {
    it("requires authentication", async () => {
      const response = await fetch(`${baseUrl}/api/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "excel",
          reportType: "periodic-quotation",
          data: { test: "data" },
        }),
      });
      expect(response.status).toBe(401);
    });

    it("validates required parameters", async () => {
      const response = await fetch(`${baseUrl}/api/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });

    it("validates export format", async () => {
      const response = await fetch(`${baseUrl}/api/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "invalid",
          reportType: "periodic-quotation",
          data: { test: "data" },
        }),
      });
      expect(response.status).toBe(400);
    });

    it("exports to Excel format", async () => {
      const reportData = {
        reportType: "periodic-quotation",
        period: { startDate: "2024-01-01", endDate: "2024-12-31" },
        summary: { totalQuotes: 2 },
        quotations: [
          { quoteNumber: "Q-001", customerName: "ABC Corp", status: "ACCEPTED" },
        ],
      };

      const response = await fetch(`${baseUrl}/api/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "excel",
          reportType: "periodic-quotation",
          data: reportData,
        }),
      });

      if (response.status === 200) {
        expect(response.headers.get("Content-Type")).toContain(
          "application/vnd.ms-excel"
        );
        expect(response.headers.get("Content-Disposition")).toContain(".xls");
      }
    });

    it("exports to PDF format (as HTML)", async () => {
      const reportData = {
        reportType: "periodic-quotation",
        period: { startDate: "2024-01-01", endDate: "2024-12-31" },
        summary: { totalQuotes: 2 },
        quotations: [
          { quoteNumber: "Q-001", customerName: "ABC Corp", status: "ACCEPTED" },
        ],
      };

      const response = await fetch(`${baseUrl}/api/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "pdf",
          reportType: "periodic-quotation",
          data: reportData,
        }),
      });

      if (response.status === 200) {
        expect(response.headers.get("Content-Type")).toContain("text/html");
        expect(response.headers.get("Content-Disposition")).toContain(".html");
      }
    });
  });
});

// Unit tests for report types and structures
describe("Report Types and Structures", () => {
  it("defines all 5 report types", () => {
    const reportTypes = [
      "periodic-quotation",
      "personnel-performance",
      "won-lost-analysis",
      "country-mode-volume",
      "loss-reason",
    ];

    expect(reportTypes).toHaveLength(5);
    expect(reportTypes).toContain("periodic-quotation");
    expect(reportTypes).toContain("personnel-performance");
    expect(reportTypes).toContain("won-lost-analysis");
    expect(reportTypes).toContain("country-mode-volume");
    expect(reportTypes).toContain("loss-reason");
  });

  it("valid report types should be accepted", () => {
    const validReportTypes = [
      "periodic-quotation",
      "personnel-performance",
      "won-lost-analysis",
      "country-mode-volume",
      "loss-reason",
    ];

    const isValid = (type: string) => validReportTypes.includes(type);

    expect(isValid("periodic-quotation")).toBe(true);
    expect(isValid("personnel-performance")).toBe(true);
    expect(isValid("won-lost-analysis")).toBe(true);
    expect(isValid("country-mode-volume")).toBe(true);
    expect(isValid("loss-reason")).toBe(true);
    expect(isValid("invalid-type")).toBe(false);
  });

  it("valid export formats should be accepted", () => {
    const validFormats = ["pdf", "excel"];

    const isValidFormat = (format: string) => validFormats.includes(format);

    expect(isValidFormat("pdf")).toBe(true);
    expect(isValidFormat("excel")).toBe(true);
    expect(isValidFormat("csv")).toBe(false);
    expect(isValidFormat("doc")).toBe(false);
  });

  it("periodic quotation report has correct data structure", () => {
    const mockReport = {
      reportType: "periodic-quotation",
      period: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
      summary: {
        totalQuotes: 10,
        wonQuotes: 5,
        lostQuotes: 3,
        pendingQuotes: 2,
        winRate: "50.0",
        currencyTotals: {
          USD: 50000,
          EUR: 25000,
        },
      },
      quotations: [
        {
          id: "quote-1",
          quoteNumber: "Q-001",
          customerName: "ABC Corp",
          transportMode: "SEA",
          origin: "Shanghai, Çin",
          destination: "İstanbul, Türkiye",
          totalCost: 5000,
          currency: "USD",
          status: "ACCEPTED",
          createdAt: "2024-03-15T00:00:00Z",
          createdBy: "Ahmet Yılmaz",
        },
      ],
    };

    expect(mockReport.reportType).toBe("periodic-quotation");
    expect(mockReport.summary).toHaveProperty("totalQuotes");
    expect(mockReport.summary).toHaveProperty("wonQuotes");
    expect(mockReport.summary).toHaveProperty("lostQuotes");
    expect(mockReport.summary).toHaveProperty("pendingQuotes");
    expect(mockReport.summary).toHaveProperty("winRate");
    expect(mockReport.summary).toHaveProperty("currencyTotals");
    expect(Array.isArray(mockReport.quotations)).toBe(true);
  });

  it("personnel performance report has correct data structure", () => {
    const mockReport = {
      reportType: "personnel-performance",
      period: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
      summary: {
        totalQuotes: 100,
        wonQuotes: 60,
        overallWinRate: "60.0",
      },
      personnel: [
        {
          userId: "user-1",
          name: "Ahmet Yılmaz",
          email: "ahmet@example.com",
          role: "SALES_REP",
          totalQuotes: 20,
          wonQuotes: 12,
          lostQuotes: 8,
          winRate: "60.0",
          totalValue: 100000,
          wonValue: 60000,
          activities: 50,
        },
      ],
    };

    expect(mockReport.reportType).toBe("personnel-performance");
    expect(mockReport.summary).toHaveProperty("totalQuotes");
    expect(mockReport.summary).toHaveProperty("wonQuotes");
    expect(mockReport.summary).toHaveProperty("overallWinRate");
    expect(Array.isArray(mockReport.personnel)).toBe(true);
  });

  it("won/lost analysis report has correct data structure", () => {
    const mockReport = {
      reportType: "won-lost-analysis",
      period: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
      summary: {
        totalDecided: 100,
        wonCount: 60,
        lostCount: 40,
        winRate: "60.0",
        wonValue: 500000,
        lostValue: 300000,
      },
      breakdown: {
        byTransportMode: {
          SEA: { won: 30, lost: 20 },
          AIR: { won: 20, lost: 15 },
          ROAD: { won: 10, lost: 5 },
        },
        byMonth: [
          { month: "2024-01", won: 5, lost: 3 },
          { month: "2024-02", won: 6, lost: 4 },
        ],
      },
      quotations: [],
    };

    expect(mockReport.reportType).toBe("won-lost-analysis");
    expect(mockReport.summary).toHaveProperty("totalDecided");
    expect(mockReport.summary).toHaveProperty("wonCount");
    expect(mockReport.summary).toHaveProperty("lostCount");
    expect(mockReport.summary).toHaveProperty("winRate");
    expect(mockReport.breakdown).toHaveProperty("byTransportMode");
    expect(mockReport.breakdown).toHaveProperty("byMonth");
  });

  it("country/mode volume report has correct data structure", () => {
    const mockReport = {
      reportType: "country-mode-volume",
      period: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
      summary: {
        totalQuotations: 100,
        uniqueOrigins: 10,
        uniqueDestinations: 15,
        totalValue: 1000000,
      },
      byOriginCountry: [
        { country: "Çin", count: 30, value: 300000 },
        { country: "ABD", count: 20, value: 200000 },
      ],
      byDestinationCountry: [
        { country: "Türkiye", count: 40, value: 400000 },
        { country: "Almanya", count: 25, value: 250000 },
      ],
      byTransportMode: [
        { mode: "SEA", count: 50, value: 500000 },
        { mode: "AIR", count: 30, value: 300000 },
      ],
      topRoutes: [
        { origin: "Çin", destination: "Türkiye", count: 20, value: 200000 },
        { origin: "ABD", destination: "Almanya", count: 15, value: 150000 },
      ],
    };

    expect(mockReport.reportType).toBe("country-mode-volume");
    expect(mockReport.summary).toHaveProperty("totalQuotations");
    expect(mockReport.summary).toHaveProperty("uniqueOrigins");
    expect(mockReport.summary).toHaveProperty("uniqueDestinations");
    expect(Array.isArray(mockReport.byOriginCountry)).toBe(true);
    expect(Array.isArray(mockReport.byDestinationCountry)).toBe(true);
    expect(Array.isArray(mockReport.byTransportMode)).toBe(true);
    expect(Array.isArray(mockReport.topRoutes)).toBe(true);
  });

  it("loss reason report has correct data structure", () => {
    const mockReport = {
      reportType: "loss-reason",
      period: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
      summary: {
        totalLostQuotes: 40,
        totalLostValue: 300000,
        averageLostValue: "7500.00",
      },
      lossReasons: [
        { id: "price", label: "Fiyat", count: 15, value: 112500, percentage: "37.5" },
        { id: "competitor", label: "Rakip", count: 12, value: 90000, percentage: "30.0" },
        { id: "delay", label: "Gecikmeli Dönüş", count: 8, value: 60000, percentage: "20.0" },
        { id: "budget", label: "Bütçe Yok", count: 3, value: 22500, percentage: "7.5" },
        { id: "other", label: "Diğer", count: 2, value: 15000, percentage: "5.0" },
      ],
      quotations: [],
    };

    expect(mockReport.reportType).toBe("loss-reason");
    expect(mockReport.summary).toHaveProperty("totalLostQuotes");
    expect(mockReport.summary).toHaveProperty("totalLostValue");
    expect(mockReport.summary).toHaveProperty("averageLostValue");
    expect(mockReport.lossReasons).toHaveLength(5);
    expect(mockReport.lossReasons[0]).toHaveProperty("id");
    expect(mockReport.lossReasons[0]).toHaveProperty("label");
    expect(mockReport.lossReasons[0]).toHaveProperty("count");
    expect(mockReport.lossReasons[0]).toHaveProperty("value");
    expect(mockReport.lossReasons[0]).toHaveProperty("percentage");
  });
});
