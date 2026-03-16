import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@globalship.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  // Check if admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      firstName: "System",
      lastName: "Administrator",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log("Created admin user:", adminEmail);
  console.log("Password: [set via ADMIN_PASSWORD env var]");
}

createAdminUser()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
