/**
 * Tek seferlik script: hgtrans.com domain'inde 5 kullaniciyi ekler/gunceller.
 * Calistirmak icin (apps/api dizininden):
 *   bun run scripts/add-hgtrans-users.ts
 *
 * idempotent: varsa sifre + isActive guncellenir, yoksa olusturulur.
 */

import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';

const COMMON_PASSWORD = 'hgtrans1234*';

type Role = 'ADMIN' | 'USER';

const ACCOUNTS: { email: string; fullName: string; role: Role }[] = [
  { email: 'nisa@hgtrans.com', fullName: 'Nisa', role: 'USER' },
  { email: 'anil@hgtrans.com', fullName: 'Anıl', role: 'USER' },
  { email: 'banu@hgtrans.com', fullName: 'Banu', role: 'ADMIN' },
  { email: 'ecehan@hgtrans.com', fullName: 'Ecehan', role: 'USER' },
  { email: 'hguclu@hgtrans.com', fullName: 'Hakan Güçlü', role: 'ADMIN' },
];

async function main() {
  const passwordHash = await bcrypt.hash(COMMON_PASSWORD, 12);

  for (const acc of ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        passwordHash,
        fullName: acc.fullName,
        role: acc.role,
        isActive: true,
      },
      create: {
        email: acc.email,
        passwordHash,
        fullName: acc.fullName,
        role: acc.role,
        isActive: true,
      },
    });
    console.log(`OK ${user.email} (id=${user.id}, role=${user.role})`);
  }

  console.log('Tamamlandi. Ortak sifre:', COMMON_PASSWORD);
}

main()
  .catch((e) => {
    console.error('HATA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
