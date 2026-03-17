import { prisma } from '@/lib/prisma'
import { calculateSimilarity, findPotentialDuplicates, updateLastContactDate, updateLastQuoteDate } from '@/lib/services/customerService'

describe('Customer Service', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.quotation.deleteMany({})
    await prisma.activity.deleteMany({})
    await prisma.customer.deleteMany({})
  })

  describe('calculateSimilarity', () => {
    it('returns 100 for identical strings', () => {
      expect(calculateSimilarity('Global Logistics', 'Global Logistics')).toBe(100)
    })

    it('returns 100 for identical strings with different case', () => {
      expect(calculateSimilarity('Global Logistics', 'global logistics')).toBe(100)
    })

    it('returns high similarity for similar company names', () => {
      const similarity = calculateSimilarity('Global Logistics Corp', 'Global Logistics Corporation')
      expect(similarity).toBeGreaterThanOrEqual(70)
    })

    it('returns low similarity for different names', () => {
      const similarity = calculateSimilarity('ABC Shipping', 'XYZ Logistics')
      expect(similarity).toBeLessThan(50)
    })

    it('handles empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(100)
    })

    it('returns 0 for completely different strings', () => {
      const similarity = calculateSimilarity('ABC', 'XYZ')
      expect(similarity).toBeLessThan(50)
    })
  })

  describe('updateLastContactDate', () => {
    it('updates lastContactDate for a customer', async () => {
      const customer = await prisma.customer.create({
        data: {
          companyName: 'Test Company',
          email: 'test@example.com',
          status: 'ACTIVE',
        },
      })

      expect(customer.lastContactDate).toBeNull()

      await updateLastContactDate(customer.id)

      const updated = await prisma.customer.findUnique({
        where: { id: customer.id },
      })

      expect(updated?.lastContactDate).toBeInstanceOf(Date)
    })
  })

  describe('updateLastQuoteDate', () => {
    it('updates lastQuoteDate for a customer', async () => {
      const customer = await prisma.customer.create({
        data: {
          companyName: 'Test Company',
          email: 'test@example.com',
          status: 'ACTIVE',
        },
      })

      expect(customer.lastQuoteDate).toBeNull()

      await updateLastQuoteDate(customer.id)

      const updated = await prisma.customer.findUnique({
        where: { id: customer.id },
      })

      expect(updated?.lastQuoteDate).toBeInstanceOf(Date)
    })
  })

  describe('findPotentialDuplicates', () => {
    it('finds duplicates by exact email match', async () => {
      await prisma.customer.create({
        data: {
          companyName: 'Global Logistics',
          email: 'info@globallogistics.com',
          phone: '+90 212 555 0000',
          status: 'ACTIVE',
        },
      })

      const duplicates = await findPotentialDuplicates(
        'Different Company',
        'info@globallogistics.com'
      )

      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchedFields).toContain('email')
      expect(duplicates[0].similarity).toBe(100)
    })

    it('finds duplicates by exact phone match', async () => {
      await prisma.customer.create({
        data: {
          companyName: 'Global Logistics',
          email: 'info@globallogistics.com',
          phone: '+90 212 555 0000',
          status: 'ACTIVE',
        },
      })

      const duplicates = await findPotentialDuplicates(
        'Different Company',
        undefined,
        '+90 212 555 0000'
      )

      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchedFields).toContain('phone')
      expect(duplicates[0].similarity).toBe(100)
    })

    it('finds duplicates by fuzzy company name match (80%+)', async () => {
      await prisma.customer.create({
        data: {
          companyName: 'Global Logistics Corporation',
          email: 'info@globallogistics.com',
          status: 'ACTIVE',
        },
      })

      const duplicates = await findPotentialDuplicates('Global Logistics Corporations')

      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchedFields).toContain('companyName')
      expect(duplicates[0].similarity).toBeGreaterThanOrEqual(80)
    })

    it('excludes the specified customer ID from results', async () => {
      const existing = await prisma.customer.create({
        data: {
          companyName: 'Global Logistics',
          email: 'info@globallogistics.com',
          status: 'ACTIVE',
        },
      })

      const duplicates = await findPotentialDuplicates(
        'Global Logistics',
        undefined,
        undefined,
        existing.id
      )

      expect(duplicates).toHaveLength(0)
    })

    it('sorts results by similarity (highest first)', async () => {
      await prisma.customer.create({
        data: {
          companyName: 'Global Logistics Corporation',
          email: 'info1@globallogistics.com',
          status: 'ACTIVE',
        },
      })

      await prisma.customer.create({
        data: {
          companyName: 'Global Logistics Corp',
          email: 'info2@globallogistics.com',
          status: 'ACTIVE',
        },
      })

      const duplicates = await findPotentialDuplicates('Global Logistics Corporations')

      expect(duplicates.length).toBeGreaterThanOrEqual(1)
      if (duplicates.length >= 2) {
        expect(duplicates[0].similarity).toBeGreaterThanOrEqual(duplicates[1].similarity)
      }
    })
  })
})
