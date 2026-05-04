/**
 * Tek seferlik cleanup: eski loss_reason lookup degerlerini siler ve
 * mevcut Quotation.lossReason kayitlarinda eski stringi yeni karsiligiyla
 * degistirir.
 *
 * Calistirma: bun run apps/api/scripts/cleanup-loss-reasons.ts
 * Idempotent — tekrar calistirsan eski deger kalmadigindan no-op.
 */

import { prisma } from '../src/config/database';

// Eski → yeni karsilik (en yakin yeni kategori)
const REMAP: Record<string, string> = {
  Fiyat: 'Fiyat yüksek',
  Rakip: 'Rakip daha kapsamlı çözüm',
  'Gecikmeli dönüş': 'Geç dönüş yapıldı',
};

async function main() {
  console.log('--- Loss reason cleanup ---');

  // 1) Mevcut eski deger sayilari
  const before = await prisma.lookupValue.findMany({
    where: { category: 'loss_reason', value: { in: Object.keys(REMAP) } },
    select: { id: true, value: true },
  });
  console.log(`Eski lookup degerleri (${before.length}):`, before.map((b) => b.value));

  // 2) Eski string'i tutan teklif sayisi (tam esleme — CSV degil)
  for (const [oldVal, newVal] of Object.entries(REMAP)) {
    const count = await prisma.quotation.count({
      where: { lossReason: oldVal },
    });
    if (count > 0) {
      const r = await prisma.quotation.updateMany({
        where: { lossReason: oldVal },
        data: { lossReason: newVal },
      });
      console.log(`  ${oldVal} → ${newVal}: ${r.count} teklif guncellendi`);
    } else {
      console.log(`  ${oldVal}: tam esleme yok (CSV icinde olabilir, dokunmuyoruz)`);
    }
  }

  // 3) Eski lookup degerlerini sil
  const del = await prisma.lookupValue.deleteMany({
    where: { category: 'loss_reason', value: { in: Object.keys(REMAP) } },
  });
  console.log(`Silinen lookup degeri: ${del.count}`);

  // 4) Sonuc
  const after = await prisma.lookupValue.findMany({
    where: { category: 'loss_reason' },
    orderBy: { value: 'asc' },
    select: { value: true },
  });
  console.log(`Mevcut loss_reason degerleri (${after.length}):`);
  for (const a of after) console.log(`  - ${a.value}`);

  console.log('Tamamlandi.');
}

main()
  .catch((e) => {
    console.error('HATA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
