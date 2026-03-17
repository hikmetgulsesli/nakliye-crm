import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Simple quote number generator for tests
function generateTestQuoteNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TKF-${year}-${random}`;
}

describe("Audit Log System", () => {
  let adminUser: { id: string; email: string; role: string };
  let salesRep: { id: string; email: string; role: string };
  let testCustomer: { id: string; companyName: string };
  let testQuotation: { id: string; quoteNumber: string };

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.auditLog.deleteMany({});
    await prisma.quotationRevision.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.customer.deleteMany({ where: { email: { contains: "test-audit" } } });
    await prisma.user.deleteMany({ where: { email: { contains: "test-audit" } } });

    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        email: `test-audit-admin-${Date.now()}@example.com`,
        passwordHash: "hashedpassword",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      },
    });

    // Create sales rep user
    salesRep = await prisma.user.create({
      data: {
        email: `test-audit-sales-${Date.now()}@example.com`,
        passwordHash: "hashedpassword",
        firstName: "Sales",
        lastName: "Rep",
        role: "SALES_REP",
      },
    });

    // Create test customer
    testCustomer = await prisma.customer.create({
      data: {
        companyName: "Audit Test Customer Ltd.",
        contactName: "Ahmet Yılmaz",
        email: `test-audit-customer-${Date.now()}@example.com`,
        phone: "+90 555 123 4567",
        assignedToId: salesRep.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({});
    await prisma.quotationRevision.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.customer.deleteMany({ where: { id: testCustomer?.id } });
    await prisma.user.deleteMany({ where: { id: { in: [adminUser?.id, salesRep?.id] } } });
    await prisma.$disconnect();
  });

  describe("Audit Log Creation", () => {
    it("should create audit log when customer is created", async () => {
      const customer = await prisma.$transaction(async (tx) => {
        const newCustomer = await tx.customer.create({
          data: {
            companyName: "New Audit Customer",
            contactName: "Mehmet Kaya",
            email: `audit-create-${Date.now()}@example.com`,
            phone: "+90 555 987 6543",
            assignedToId: salesRep.id,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: salesRep.id,
            action: "CREATE",
            entityType: "customer",
            entityId: newCustomer.id,
            newValues: newCustomer as unknown as Prisma.InputJsonValue,
          },
        });

        return newCustomer;
      });

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: "customer",
          entityId: customer.id,
          action: "CREATE",
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.userId).toBe(salesRep.id);
      expect(auditLog?.action).toBe("CREATE");
      expect(auditLog?.entityType).toBe("customer");
      expect(auditLog?.newValues).toBeTruthy();

      // Cleanup
      await prisma.auditLog.deleteMany({ where: { entityId: customer.id } });
      await prisma.customer.delete({ where: { id: customer.id } });
    });

    it("should create audit log with field-level diff when customer is updated", async () => {
      const changedFields = {
        companyName: { old: "Audit Test Customer Ltd.", new: "Updated Customer Name" },
        contactName: { old: "Ahmet Yılmaz", new: "Mehmet Kaya" },
      };

      await prisma.$transaction(async (tx) => {
        await tx.customer.update({
          where: { id: testCustomer.id },
          data: {
            companyName: "Updated Customer Name",
            contactName: "Mehmet Kaya",
          },
        });

        await tx.auditLog.create({
          data: {
            userId: adminUser.id,
            action: "UPDATE",
            entityType: "customer",
            entityId: testCustomer.id,
            oldValues: changedFields as Prisma.InputJsonValue,
            newValues: { companyName: "Updated Customer Name", contactName: "Mehmet Kaya" } as Prisma.InputJsonValue,
          },
        });
      });

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: "customer",
          entityId: testCustomer.id,
          action: "UPDATE",
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.userId).toBe(adminUser.id);
      expect(auditLog?.action).toBe("UPDATE");
      expect(auditLog?.oldValues).toBeTruthy();
      expect(auditLog?.newValues).toBeTruthy();

      const oldValues = auditLog?.oldValues as Record<string, { old: string; new: string }>;
      expect(oldValues.companyName.old).toBe("Audit Test Customer Ltd.");
      expect(oldValues.companyName.new).toBe("Updated Customer Name");
    });

    it("should create audit log when customer is deleted", async () => {
      const tempCustomer = await prisma.customer.create({
        data: {
          companyName: "Temp Customer for Deletion",
          contactName: "Temp User",
          email: `audit-delete-${Date.now()}@example.com`,
          assignedToId: salesRep.id,
        },
      });

      await prisma.$transaction(async (tx) => {
        await tx.auditLog.create({
          data: {
            userId: adminUser.id,
            action: "DELETE",
            entityType: "customer",
            entityId: tempCustomer.id,
            oldValues: tempCustomer as unknown as Prisma.InputJsonValue,
          },
        });

        await tx.customer.delete({
          where: { id: tempCustomer.id },
        });
      });

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: "customer",
          entityId: tempCustomer.id,
          action: "DELETE",
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.userId).toBe(adminUser.id);
      expect(auditLog?.action).toBe("DELETE");
    });

    it("should create audit log when quotation is created", async () => {
      const quotation = await prisma.$transaction(async (tx) => {
        const quoteNumber = generateTestQuoteNumber();
        const newQuotation = await tx.quotation.create({
          data: {
            quoteNumber,
            customerId: testCustomer.id,
            createdById: salesRep.id,
            originCity: "İstanbul",
            originCountry: "Türkiye",
            destinationCity: "Hamburg",
            destinationCountry: "Almanya",
            transportMode: "SEA",
            status: "DRAFT",
          },
        });

        await tx.auditLog.create({
          data: {
            userId: salesRep.id,
            action: "CREATE",
            entityType: "quotation",
            entityId: newQuotation.id,
            newValues: newQuotation as unknown as Prisma.InputJsonValue,
          },
        });

        return newQuotation;
      });

      testQuotation = quotation;

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: "quotation",
          entityId: quotation.id,
          action: "CREATE",
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.userId).toBe(salesRep.id);
      expect(auditLog?.action).toBe("CREATE");
    });

    it("should create audit log when quotation is updated", async () => {
      const changedFields = {
        originCity: { old: "İstanbul", new: "İzmir" },
        status: { old: "DRAFT", new: "SENT" },
      };

      await prisma.$transaction(async (tx) => {
        await tx.quotation.update({
          where: { id: testQuotation.id },
          data: {
            originCity: "İzmir",
            status: "SENT",
          },
        });

        await tx.auditLog.create({
          data: {
            userId: adminUser.id,
            action: "UPDATE",
            entityType: "quotation",
            entityId: testQuotation.id,
            oldValues: changedFields as Prisma.InputJsonValue,
            newValues: { originCity: "İzmir", status: "SENT" } as Prisma.InputJsonValue,
          },
        });
      });

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: "quotation",
          entityId: testQuotation.id,
          action: "UPDATE",
        },
        orderBy: { createdAt: "desc" },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.action).toBe("UPDATE");
    });

    it("should create audit log when lookup value is created", async () => {
      const lookupValue = await prisma.$transaction(async (tx) => {
        const newValue = await tx.lookupValue.create({
          data: {
            category: "test_category",
            value: "TEST_VALUE",
            label: "Test Value",
            description: "Test description",
          },
        });

        await tx.auditLog.create({
          data: {
            userId: adminUser.id,
            action: "CREATE",
            entityType: "lookup_value",
            entityId: newValue.id,
            newValues: newValue as unknown as Prisma.InputJsonValue,
          },
        });

        return newValue;
      });

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityType: "lookup_value",
          entityId: lookupValue.id,
          action: "CREATE",
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.userId).toBe(adminUser.id);

      // Cleanup
      await prisma.auditLog.deleteMany({ where: { entityId: lookupValue.id } });
      await prisma.lookupValue.delete({ where: { id: lookupValue.id } });
    });
  });

  describe("Audit Log Filtering and Querying", () => {
    it("should filter audit logs by action type", async () => {
      const createLogs = await prisma.auditLog.findMany({
        where: { action: "CREATE" },
      });

      const updateLogs = await prisma.auditLog.findMany({
        where: { action: "UPDATE" },
      });

      const deleteLogs = await prisma.auditLog.findMany({
        where: { action: "DELETE" },
      });

      expect(createLogs.length).toBeGreaterThan(0);
      expect(updateLogs.length).toBeGreaterThan(0);
      expect(deleteLogs.length).toBeGreaterThan(0);
    });

    it("should filter audit logs by entity type", async () => {
      const customerLogs = await prisma.auditLog.findMany({
        where: { entityType: "customer" },
      });

      const quotationLogs = await prisma.auditLog.findMany({
        where: { entityType: "quotation" },
      });

      expect(customerLogs.length).toBeGreaterThan(0);
      expect(quotationLogs.length).toBeGreaterThan(0);
    });

    it("should filter audit logs by user", async () => {
      const adminLogs = await prisma.auditLog.findMany({
        where: { userId: adminUser.id },
      });

      const salesRepLogs = await prisma.auditLog.findMany({
        where: { userId: salesRep.id },
      });

      expect(adminLogs.length).toBeGreaterThan(0);
      expect(salesRepLogs.length).toBeGreaterThan(0);
    });

    it("should include user information when querying audit logs", async () => {
      const auditLog = await prisma.auditLog.findFirst({
        where: { userId: adminUser.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.user).toBeTruthy();
      expect(auditLog?.user?.email).toBe(adminUser.email);
      expect(auditLog?.user?.role).toBe("ADMIN");
    });

    it("should support pagination when querying audit logs", async () => {
      const page1 = await prisma.auditLog.findMany({
        take: 2,
        skip: 0,
        orderBy: { createdAt: "desc" },
      });

      const page2 = await prisma.auditLog.findMany({
        take: 2,
        skip: 2,
        orderBy: { createdAt: "desc" },
      });

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Audit Log Data Integrity", () => {
    it("should store complete field diff for UPDATE actions", async () => {
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: "UPDATE",
          entityType: "customer",
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.oldValues).toBeTruthy();
      
      const oldValues = auditLog?.oldValues as Record<string, { old: string; new: string }>;
      expect(oldValues.companyName).toBeTruthy();
      expect(oldValues.companyName.old).toBeDefined();
      expect(oldValues.companyName.new).toBeDefined();
    });

    it("should store new values for CREATE actions", async () => {
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: "CREATE",
          entityType: "quotation",
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.newValues).toBeTruthy();
      
      const newValues = auditLog?.newValues as Record<string, unknown>;
      expect(newValues.quoteNumber || newValues.id).toBeDefined();
    });

    it("should store old values for DELETE actions", async () => {
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: "DELETE",
          entityType: "customer",
        },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.oldValues).toBeTruthy();
      
      const oldValues = auditLog?.oldValues as Record<string, unknown>;
      expect(oldValues.companyName).toBeDefined();
    });
  });
});
