import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function createAdminUser() {
  const adminEmail = "admin@globalship.com";
  const adminPassword = "Admin123!";

  // Check if admin role exists
  let adminRole = await prisma.role.findUnique({
    where: { name: "Admin" },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: "Admin",
        description: "System Administrator",
      },
    });
    console.log("Created Admin role");
  }

  // Check if user role exists
  let userRole = await prisma.role.findUnique({
    where: { name: "User" },
  });

  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        name: "User",
        description: "Standard User",
      },
    });
    console.log("Created User role");
  }

  // Check if admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "System Administrator",
      password: hashedPassword,
      roleId: adminRole.id,
      status: "Active",
    },
  });

  console.log("Created admin user:", admin.email);
  console.log("Password:", adminPassword);
}

createAdminUser()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
