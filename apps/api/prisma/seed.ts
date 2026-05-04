import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';

const lookupData: Record<string, string[]> = {
  transport_mode: ['Deniz', 'Hava', 'Kara', 'Kombine'],
  service_type: ['FCL', 'LCL', 'Parsiyel', 'Komple', 'Bulk', 'RoRo'],
  incoterm: ['FOB', 'EXW', 'FCA', 'DAP', 'CIF', 'CFR', 'DDP'],
  customer_source: ['Referans', 'Soğuk arama', 'Fuar', 'Dijital'],
  customer_status: ['Aktif', 'Pasif', 'Soğuk'],
  potential_level: ['Düşük', 'Orta', 'Yüksek'],
  quote_status: ['Bekliyor', 'Kazanıldı', 'Kaybedildi', 'İptal'],
  loss_reason: [
    // Fiyat & Bütçe
    'Fiyat yüksek',
    'Daha düşük teklif aldı',
    'Bütçe yetmedi / proje iptal',
    // Servis & Operasyon
    'Transit süresi uzun',
    'Kapasite / ekipman yok',
    'Lane / güzergah kapsamımızda yok',
    // Süreç & İletişim
    'Geç dönüş yapıldı',
    'Evrak / dokümantasyon yetersiz',
    // Rakip
    'Mevcut tedarikçide kaldı',
    'Rakip daha kapsamlı çözüm',
    // Müşteri kaynaklı
    'Proje ertelendi / iptal',
    'Spek değişti / kendi taşıyacak',
    // Diğer
    'Diğer',
  ],
  currency: ['USD', 'EUR', 'TRY'],
  activity_type: [
    'Telefon',
    'Telefon (cevapsız)',
    'WhatsApp',
    'WhatsApp (gelen)',
    'E-posta',
    'E-posta (gelen)',
    'Yüz Yüze',
    'Video Görüşme',
    'Saha Ziyareti',
    'Ses Notu',
    'Not',
  ],
  activity_outcome: ['Olumlu', 'Nötr', 'Olumsuz', 'Teklif İstendi'],
  country: ['Türkiye', 'Çin', 'Almanya', 'İtalya', 'ABD', 'İngiltere', 'Fransa', 'İspanya', 'Hollanda'],
};

async function main() {
  console.log('Seeding database...');

  // --- Users ---
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const userPassword = await bcrypt.hash('User123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nakliyecrm.com' },
    update: {},
    create: {
      email: 'admin@nakliyecrm.com',
      passwordHash: adminPassword,
      fullName: 'Sistem Yöneticisi',
      role: 'ADMIN',
      phone: '+90 555 000 0001',
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  const salesReps = [
    { email: 'ahmet@nakliyecrm.com', fullName: 'Ahmet Yılmaz', phone: '+90 555 000 0002' },
    { email: 'ayse@nakliyecrm.com', fullName: 'Ayşe Demir', phone: '+90 555 000 0003' },
    { email: 'mehmet@nakliyecrm.com', fullName: 'Mehmet Kaya', phone: '+90 555 000 0004' },
  ];

  for (const rep of salesReps) {
    const user = await prisma.user.upsert({
      where: { email: rep.email },
      update: {},
      create: {
        email: rep.email,
        passwordHash: userPassword,
        fullName: rep.fullName,
        role: 'USER',
        phone: rep.phone,
      },
    });
    console.log(`Sales rep created: ${user.email}`);
  }

  // --- Lookup Values ---
  for (const [category, values] of Object.entries(lookupData)) {
    for (let i = 0; i < values.length; i++) {
      await prisma.lookupValue.upsert({
        where: { category_value: { category, value: values[i] } },
        update: { sortOrder: i + 1 },
        create: {
          category,
          value: values[i],
          sortOrder: i + 1,
          isActive: true,
        },
      });
    }
    console.log(`Lookup category seeded: ${category} (${values.length} values)`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
