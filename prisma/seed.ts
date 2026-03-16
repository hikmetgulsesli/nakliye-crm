import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding lookup values...')

  // Transport Modes
  const transportModes = [
    { value: 'AIR', label: 'Hava Kargo', description: 'Air Freight' },
    { value: 'SEA', label: 'Deniz Kargo', description: 'Sea Freight' },
    { value: 'ROAD', label: 'Kara Taşımacılığı', description: 'Road Freight' },
    { value: 'RAIL', label: 'Demiryolu', description: 'Rail Freight' },
    { value: 'MULTIMODAL', label: 'Multimodal', description: 'Multimodal Transport' },
  ]

  for (const mode of transportModes) {
    await prisma.lookupValue.upsert({
      where: { category_value: { category: 'transport_mode', value: mode.value } },
      update: {},
      create: {
        category: 'transport_mode',
        value: mode.value,
        label: mode.label,
        description: mode.description,
      },
    })
  }

  // Incoterms
  const incoterms = [
    { value: 'EXW', label: 'EXW - Ex Works', description: 'Müşteri tüm masrafları üstlenir' },
    { value: 'FCA', label: 'FCA - Free Carrier', description: 'Taşıyıcıya teslim' },
    { value: 'FAS', label: 'FAS - Free Alongside Ship', description: 'Geminin yanına teslim' },
    { value: 'FOB', label: 'FOB - Free On Board', description: 'Gemiye teslim' },
    { value: 'CFR', label: 'CFR - Cost and Freight', description: 'Navlun dahil mal bedeli' },
    { value: 'CIF', label: 'CIF - Cost, Insurance and Freight', description: 'Navlun ve sigorta dahil' },
    { value: 'CPT', label: 'CPT - Carriage Paid To', description: 'Taşıma bedeli ödenmiş' },
    { value: 'CIP', label: 'CIP - Carriage and Insurance Paid To', description: 'Taşıma ve sigorta bedeli ödenmiş' },
    { value: 'DAP', label: 'DAP - Delivered at Place', description: 'Yerde teslim' },
    { value: 'DPU', label: 'DPU - Delivered at Place Unloaded', description: 'Boşaltılmış olarak teslim' },
    { value: 'DDP', label: 'DDP - Delivered Duty Paid', description: 'Gümrük vergisi ödenmiş teslim' },
  ]

  for (const term of incoterms) {
    await prisma.lookupValue.upsert({
      where: { category_value: { category: 'incoterm', value: term.value } },
      update: {},
      create: {
        category: 'incoterm',
        value: term.value,
        label: term.label,
        description: term.description,
      },
    })
  }

  // Package Types
  const packageTypes = [
    { value: 'BOX', label: 'Koli', description: 'Box/Package' },
    { value: 'PALLET', label: 'Palet', description: 'Pallet' },
    { value: 'CRATE', label: 'Kasa', description: 'Wooden Crate' },
    { value: 'DRUM', label: 'Varil', description: 'Drum' },
    { value: 'BAG', label: 'Çuval', description: 'Bag' },
    { value: 'ROLL', label: 'Rulo', description: 'Roll' },
    { value: 'CONTAINER_20', label: '20\' Container', description: '20 feet container' },
    { value: 'CONTAINER_40', label: '40\' Container', description: '40 feet container' },
    { value: 'CONTAINER_40HC', label: '40\' HC Container', description: '40 feet high cube container' },
  ]

  for (const type of packageTypes) {
    await prisma.lookupValue.upsert({
      where: { category_value: { category: 'package_type', value: type.value } },
      update: {},
      create: {
        category: 'package_type',
        value: type.value,
        label: type.label,
        description: type.description,
      },
    })
  }

  // Cargo Types
  const cargoTypes = [
    { value: 'GENERAL', label: 'Genel Kargo', description: 'General Cargo' },
    { value: 'HAZARDOUS', label: 'Tehlikeli Madde', description: 'Hazardous Materials' },
    { value: 'PERISHABLE', label: 'Çabuk Bozulur', description: 'Perishable Goods' },
    { value: 'OVERSIZED', label: 'Ölçü Fazlası', description: 'Oversized Cargo' },
    { value: 'FRAGILE', label: 'Kırılabilir', description: 'Fragile' },
    { value: 'VALUABLE', label: 'Değerli Eşya', description: 'High Value' },
    { value: 'TEMPERATURE_CONTROLLED', label: 'Soğuk Zincir', description: 'Temperature Controlled' },
  ]

  for (const type of cargoTypes) {
    await prisma.lookupValue.upsert({
      where: { category_value: { category: 'cargo_type', value: type.value } },
      update: {},
      create: {
        category: 'cargo_type',
        value: type.value,
        label: type.label,
        description: type.description,
      },
    })
  }

  // Currency Options
  const currencies = [
    { value: 'USD', label: 'USD - US Dollar', description: 'United States Dollar' },
    { value: 'EUR', label: 'EUR - Euro', description: 'Euro' },
    { value: 'TRY', label: 'TRY - Turkish Lira', description: 'Turkish Lira' },
    { value: 'GBP', label: 'GBP - British Pound', description: 'British Pound Sterling' },
  ]

  for (const currency of currencies) {
    await prisma.lookupValue.upsert({
      where: { category_value: { category: 'currency', value: currency.value } },
      update: {},
      create: {
        category: 'currency',
        value: currency.value,
        label: currency.label,
        description: currency.description,
      },
    })
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
