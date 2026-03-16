import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function createTestUsers() {
  // Ensure roles exist
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
  }

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
  }

  // Create admin user if not exists
  const adminEmail = "admin@globalship.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin123!", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Ahmet Yılmaz",
        password: hashedPassword,
        roleId: adminRole.id,
        status: "Active",
      },
    });
    console.log("Created admin user: admin@globalship.com");
  }

  // Create regular user if not exists
  const userEmail = "elif@reelforge.com";
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash("User123!", 10);
    await prisma.user.create({
      data: {
        email: userEmail,
        name: "Elif Yılmaz",
        password: hashedPassword,
        roleId: userRole.id,
        status: "Active",
      },
    });
    console.log("Created user: elif@reelforge.com");
  }

  // Create another user
  const user2Email = "mehmet@globalship.com";
  const existingUser2 = await prisma.user.findUnique({
    where: { email: user2Email },
  });

  if (!existingUser2) {
    const hashedPassword = await bcrypt.hash("User123!", 10);
    await prisma.user.create({
      data: {
        email: user2Email,
        name: "Mehmet Kaya",
        password: hashedPassword,
        roleId: userRole.id,
        status: "Active",
      },
    });
    console.log("Created user: mehmet@globalship.com");
  }
}

createTestUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
