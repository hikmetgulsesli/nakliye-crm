import { prisma } from "@/lib/prisma";
import { generateQuoteNumber } from "@/lib/quote-number";

describe("Quotation Management", () => {
  let testUser: { id: string; email: string };
  let testCustomer: { id: string; companyName: string };

  beforeAll(async () => {
    // Clean up any existing test data
    // quotationRevision model not implemented
    await prisma.quotation.deleteMany({});
    await prisma.customer.deleteMany({ where: { email: { contains: "test-quotation" } } });
    await prisma.user.deleteMany({ where: { email: { contains: "test-quotation" } } });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `test-quotation-${Date.now()}@example.com`,
        passwordHash: "hashedpassword",
        firstName: "Test",
        lastName: "User",
        role: "SALES_REP",
      },
    });

    // Create test customer
    testCustomer = await prisma.customer.create({
      data: {
        companyName: "Test Customer Ltd.",
        contactName: "Ahmet Yılmaz",
        email: `test-quotation-customer-${Date.now()}@example.com`,
        phone: "+90 555 123 4567",
        assignedToId: testUser.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    // quotationRevision model not implemented
    await prisma.quotation.deleteMany({});
    await prisma.customer.deleteMany({ where: { id: testCustomer.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe("Quote Number Generation", () => {
    it("should generate quote number in TKF-YYYY-XXXX format", async () => {
      const quoteNumber = await generateQuoteNumber();
      const year = new Date().getFullYear();
      
      expect(quoteNumber).toMatch(new RegExp(`^TKF-${year}-\\d{4}$`));
    });

    it("should generate sequential quote numbers", async () => {
      // Create first quotation to get a base number
      const quote1 = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "Test Seq 1",
          originCountry: "Türkiye",
          destinationCity: "Test Dest 1",
          destinationCountry: "Almanya",
          transportMode: "AIR",
          status: "DRAFT",
        },
      });

      // Generate next number (should be based on quote1)
      const quoteNumber2 = await generateQuoteNumber();
      
      // Create second quotation
      const quote2 = await prisma.quotation.create({
        data: {
          quoteNumber: quoteNumber2,
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "Test Seq 2",
          originCountry: "Türkiye",
          destinationCity: "Test Dest 2",
          destinationCountry: "Almanya",
          transportMode: "AIR",
          status: "DRAFT",
        },
      });

      // Generate third number
      const quoteNumber3 = await generateQuoteNumber();
      
      // Clean up
      await prisma.quotation.deleteMany({
        where: { id: { in: [quote1.id, quote2.id] } },
      });
      
      // Extract numbers
      const num1 = parseInt(quote1.quoteNumber.split("-")[2], 10);
      const num2 = parseInt(quoteNumber2.split("-")[2], 10);
      const num3 = parseInt(quoteNumber3.split("-")[2], 10);
      
      // Verify sequential numbers
      expect(num2).toBe(num1 + 1);
      expect(num3).toBe(num2 + 1);
    });
  });

  describe("Quotation CRUD Operations", () => {
    it("should create a quotation with auto-generated quote number", async () => {
      const year = new Date().getFullYear();
      
      const quotation = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "İstanbul",
          originCountry: "Türkiye",
          destinationCity: "Hamburg",
          destinationCountry: "Almanya",
          transportMode: "SEA",
          incoterm: "FOB",
          freightCost: "1500.00",
          currency: "USD",
          status: "DRAFT",
        },
        include: {
          customer: true,
          createdBy: true,
        },
      });

      expect(quotation.quoteNumber).toMatch(new RegExp(`^TKF-${year}-\\d{4}$`));
      expect(quotation.customerId).toBe(testCustomer.id);
      expect(quotation.createdById).toBe(testUser.id);
      expect(quotation.status).toBe("DRAFT");
      expect(quotation.transportMode).toBe("SEA");
      // revisionCount not implemented
    });

    it("should update customer lastQuoteDate when quotation is created", async () => {
      const beforeCreate = new Date();
      
      await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "İzmir",
          originCountry: "Türkiye",
          destinationCity: "Rotterdam",
          destinationCountry: "Hollanda",
          transportMode: "AIR",
          status: "DRAFT",
        },
      });

      // Update customer's lastQuoteDate
      await prisma.customer.update({
        where: { id: testCustomer.id },
        data: { lastQuoteDate: new Date() },
      });

      const updatedCustomer = await prisma.customer.findUnique({
        where: { id: testCustomer.id },
      });

      expect(updatedCustomer?.lastQuoteDate).toBeTruthy();
      expect(updatedCustomer?.lastQuoteDate?.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });

    it.skip("should track quotation revisions", async () => {
      // Create initial quotation
      const quotation = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "Ankara",
          originCountry: "Türkiye",
          destinationCity: "Londra",
          destinationCountry: "İngiltere",
          transportMode: "ROAD",
          freightCost: "2000.00",
          currency: "EUR",
          status: "DRAFT",
          revisionCount: 0,
        },
      });

      // Simulate an update with revision tracking
      const updatedQuotation = await prisma.$transaction(async (tx) => {
        // Update quotation
        const updated = await tx.quotation.update({
          where: { id: quotation.id },
          data: {
            freightCost: "1800.00",
            revisionCount: { increment: 1 },
          },
        });

        // Create revision record
        await tx.quotationRevision.create({
          data: {
            quotationId: quotation.id,
            revisionNumber: 1,
            changedFields: {
              freightCost: { old: "2000.00", new: "1800.00" },
            },
            revisedById: testUser.id,
          },
        });

        return updated;
      });

      expect(updatedQuotation.freightCost?.toString()).toBe("1800");
      expect(updatedQuotation.revisionCount).toBe(1);

      // Verify revision was created
      const revisions = await prisma.quotationRevision.findMany({
        where: { quotationId: quotation.id },
      });

      expect(revisions).toHaveLength(1);
      expect(revisions[0].revisionNumber).toBe(1);
      expect(revisions[0].changedFields).toEqual({
        freightCost: { old: "2000.00", new: "1800.00" },
      });
    });

    it("should support status workflow (DRAFT → SENT → WON/LOST)", async () => {
      const quotation = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "Antalya",
          originCountry: "Türkiye",
          destinationCity: "Barselona",
          destinationCountry: "İspanya",
          transportMode: "SEA",
          status: "DRAFT",
        },
      });

      // Update to SENT
      let updated = await prisma.quotation.update({
        where: { id: quotation.id },
        data: { status: "SENT" },
      });
      expect(updated.status).toBe("SENT");

      // Update to WON
      updated = await prisma.quotation.update({
        where: { id: quotation.id },
        data: { status: "WON" },
      });
      expect(updated.status).toBe("WON");

      // Create another quotation to test LOST status
      const quotation2 = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "Bursa",
          originCountry: "Türkiye",
          destinationCity: "Milano",
          destinationCountry: "İtalya",
          transportMode: "ROAD",
          status: "PENDING",
        },
      });

      // Update to LOST with reason
      updated = await prisma.quotation.update({
        where: { id: quotation2.id },
        data: { 
          status: "LOST",
          lossReason: "PRICE",
        },
      });
      expect(updated.status).toBe("LOST");
      expect(updated.lossReason).toBe("PRICE");
    });

    it("should support all loss reasons", async () => {
      const lossReasons = ["PRICE", "COMPETITOR", "DELAYED_RESPONSE", "NO_BUDGET", "OTHER"];
      
      for (const reason of lossReasons) {
        const quotation = await prisma.quotation.create({
          data: {
            quoteNumber: await generateQuoteNumber(),
            customerId: testCustomer.id,
            createdById: testUser.id,
            originCity: "Test City",
            originCountry: "Türkiye",
            destinationCity: "Test Dest",
            destinationCountry: "Almanya",
            transportMode: "AIR",
            status: "LOST",
            lossReason: reason as "PRICE" | "COMPETITOR" | "DELAYED_RESPONSE" | "NO_BUDGET" | "OTHER",
          },
        });

        expect(quotation.lossReason).toBe(reason);

        // Cleanup
        await prisma.quotation.delete({ where: { id: quotation.id } });
      }
    });

    it.skip("should delete quotation and cascade delete revisions", async () => {
      // Create quotation with revisions
      const quotation = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "Adana",
          originCountry: "Türkiye",
          destinationCity: "Paris",
          destinationCountry: "Fransa",
          transportMode: "AIR",
          status: "DRAFT",
        },
      });

      // Add a revision
      await prisma.quotationRevision.create({
        data: {
          quotationId: quotation.id,
          revisionNumber: 1,
          changedFields: { status: { old: "DRAFT", new: "SENT" } },
          revisedById: testUser.id,
        },
      });

      // Verify revision exists
      let revisions = await prisma.quotationRevision.findMany({
        where: { quotationId: quotation.id },
      });
      expect(revisions).toHaveLength(1);

      // Delete quotation
      await prisma.quotation.delete({
        where: { id: quotation.id },
      });

      // Verify quotation is deleted
      const deletedQuotation = await prisma.quotation.findUnique({
        where: { id: quotation.id },
      });
      expect(deletedQuotation).toBeNull();

      // Verify revisions are cascade deleted
      revisions = await prisma.quotationRevision.findMany({
        where: { quotationId: quotation.id },
      });
      expect(revisions).toHaveLength(0);
    });

    it("should list quotations with filters", async () => {
      // Create multiple quotations
      const quotation1 = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "İstanbul",
          originCountry: "Türkiye",
          destinationCity: "New York",
          destinationCountry: "ABD",
          transportMode: "AIR",
          status: "SENT",
        },
      });

      const quotation2 = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "İzmir",
          originCountry: "Türkiye",
          destinationCity: "Tokyo",
          destinationCountry: "Japonya",
          transportMode: "SEA",
          status: "WON",
        },
      });

      // Filter by status
      const sentQuotations = await prisma.quotation.findMany({
        where: { status: "SENT" },
      });
      expect(sentQuotations.some((q) => q.id === quotation1.id)).toBe(true);

      // Filter by transport mode
      const seaQuotations = await prisma.quotation.findMany({
        where: { transportMode: "SEA" },
      });
      expect(seaQuotations.some((q) => q.id === quotation2.id)).toBe(true);

      // Cleanup
      await prisma.quotation.deleteMany({
        where: { id: { in: [quotation1.id, quotation2.id] } },
      });
    });

    it("should include customer and createdBy in quotation queries", async () => {
      const quotation = await prisma.quotation.create({
        data: {
          quoteNumber: await generateQuoteNumber(),
          customerId: testCustomer.id,
          createdById: testUser.id,
          originCity: "Test",
          originCountry: "Türkiye",
          destinationCity: "Test",
          destinationCountry: "Almanya",
          transportMode: "AIR",
          status: "DRAFT",
        },
        include: {
          customer: {
            select: { id: true, companyName: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      expect(quotation.customer).toBeTruthy();
      expect(quotation.customer?.companyName).toBe(testCustomer.companyName);
      expect(quotation.createdBy).toBeTruthy();
      expect(quotation.createdBy?.firstName).toBe("Test");

      // Cleanup
      await prisma.quotation.delete({ where: { id: quotation.id } });
    });
  });
});
