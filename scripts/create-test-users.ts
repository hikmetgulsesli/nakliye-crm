import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

async function createTestUsers() {
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
        firstName: "Ahmet",
        lastName: "Yılmaz",
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
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
        firstName: "Elif",
        lastName: "Yılmaz",
        passwordHash: hashedPassword,
        role: UserRole.SALES_REP,
        isActive: true,
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
        firstName: "Mehmet",
        lastName: "Kaya",
        passwordHash: hashedPassword,
        role: UserRole.SALES_REP,
        isActive: true,
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
