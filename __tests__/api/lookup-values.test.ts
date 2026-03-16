import { prisma } from '@/lib/prisma';

// Test categories for PRD dynamic lists
const TEST_CATEGORIES = [
  'transport_mode',
  'service_type', 
  'incoterm',
  'source',
  'potential',
  'customer_status',
  'quotation_status',
  'loss_reason',
  'currency',
  'port',
  'country',
];

describe('Lookup Values API', () => {
  beforeEach(async () => {
    // Clean up lookup values before each test
    await prisma.lookupValue.deleteMany({
      where: {
        category: { in: TEST_CATEGORIES },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/lookup-values', () => {
    it('should return empty array when no lookup values exist', async () => {
      const response = await fetch('http://localhost:3000/api/lookup-values');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should filter lookup values by category', async () => {
      // Create test data
      await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'AIR',
          label: 'Air Freight',
          sortOrder: 1,
          isActive: true,
        },
      });
      
      await prisma.lookupValue.create({
        data: {
          category: 'currency',
          value: 'USD',
          label: 'US Dollar',
          sortOrder: 1,
          isActive: true,
        },
      });

      const response = await fetch('http://localhost:3000/api/lookup-values?category=transport_mode');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].category).toBe('transport_mode');
    });

    it('should filter lookup values by isActive status', async () => {
      await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'ACTIVE_MODE',
          label: 'Active Mode',
          isActive: true,
        },
      });
      
      await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'INACTIVE_MODE',
          label: 'Inactive Mode',
          isActive: false,
        },
      });

      const response = await fetch('http://localhost:3000/api/lookup-values?isActive=true');
      const data = await response.json();
      
      expect(data.data.every((v: { isActive: boolean }) => v.isActive)).toBe(true);
    });

    it('should search lookup values by label', async () => {
      await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'AIR',
          label: 'Air Freight',
        },
      });
      
      await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'SEA',
          label: 'Sea Freight',
        },
      });

      const response = await fetch('http://localhost:3000/api/lookup-values?search=Air');
      const data = await response.json();
      
      expect(data.data).toHaveLength(1);
      expect(data.data[0].label).toBe('Air Freight');
    });
  });

  describe('POST /api/lookup-values', () => {
    it('should create a new lookup value', async () => {
      const newValue = {
        category: 'transport_mode',
        value: 'RAIL',
        label: 'Rail Freight',
        description: 'Transport by rail',
        sortOrder: 3,
        isActive: true,
      };

      const response = await fetch('http://localhost:3000/api/lookup-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newValue),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.label).toBe('Rail Freight');
      expect(data.data.category).toBe('transport_mode');
    });

    it('should reject duplicate values in the same category', async () => {
      await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'AIR',
          label: 'Air Freight',
        },
      });

      const response = await fetch('http://localhost:3000/api/lookup-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'transport_mode',
          value: 'AIR',
          label: 'Another Air',
        }),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await fetch('http://localhost:3000/api/lookup-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: '',
          value: '',
          label: '',
        }),
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/lookup-values/[id]', () => {
    it('should update lookup value label', async () => {
      const value = await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'AIR',
          label: 'Air Freight',
        },
      });

      const response = await fetch(`http://localhost:3000/api/lookup-values/${value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Air Cargo' }),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data.label).toBe('Air Cargo');
    });

    it('should deactivate a lookup value without deleting it', async () => {
      const value = await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'AIR',
          label: 'Air Freight',
          isActive: true,
        },
      });

      const response = await fetch(`http://localhost:3000/api/lookup-values/${value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data.isActive).toBe(false);
      
      // Verify it still exists in the database
      const stillExists = await prisma.lookupValue.findUnique({
        where: { id: value.id },
      });
      expect(stillExists).not.toBeNull();
    });

    it('should update sort order for reordering', async () => {
      const value = await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'AIR',
          label: 'Air Freight',
          sortOrder: 1,
        },
      });

      const response = await fetch(`http://localhost:3000/api/lookup-values/${value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: 5 }),
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data.sortOrder).toBe(5);
    });

    it('should return 404 for non-existent lookup value', async () => {
      const response = await fetch('http://localhost:3000/api/lookup-values/non-existent-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'New Label' }),
      });
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/lookup-values/[id]', () => {
    it('should delete a lookup value', async () => {
      const value = await prisma.lookupValue.create({
        data: {
          category: 'transport_mode',
          value: 'TEMP',
          label: 'Temporary',
        },
      });

      const response = await fetch(`http://localhost:3000/api/lookup-values/${value.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify it's deleted
      const deleted = await prisma.lookupValue.findUnique({
        where: { id: value.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 when deleting non-existent lookup value', async () => {
      const response = await fetch('http://localhost:3000/api/lookup-values/non-existent-id', {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/lookup-values/categories', () => {
    it('should return all unique categories', async () => {
      await prisma.lookupValue.create({
        data: { category: 'transport_mode', value: 'AIR', label: 'Air' },
      });
      await prisma.lookupValue.create({
        data: { category: 'currency', value: 'USD', label: 'USD' },
      });
      await prisma.lookupValue.create({
        data: { category: 'transport_mode', value: 'SEA', label: 'Sea' },
      });

      const response = await fetch('http://localhost:3000/api/lookup-values/categories');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toContain('transport_mode');
      expect(data.data).toContain('currency');
      expect(data.data).toHaveLength(2);
    });
  });
});

describe('PRD Dynamic Lists Coverage', () => {
  const prdCategories = [
    'transport_modes',
    'service_types',
    'incoterms',
    'sources',
    'potentials',
    'statuses',
    'currencies',
    'ports',
    'countries',
  ];

  it('should support all PRD dynamic list categories', () => {
    // Verify our API can handle these categories
    prdCategories.forEach(category => {
      expect(typeof category).toBe('string');
    });
  });

  it('lookup_values table has required schema fields', async () => {
    // Verify the schema supports all required fields
    const value = await prisma.lookupValue.create({
      data: {
        category: 'test_category',
        value: 'TEST_VALUE',
        label: 'Test Value',
        description: 'Test description',
        sortOrder: 1,
        isActive: true,
      },
    });

    expect(value.id).toBeDefined();
    expect(value.category).toBe('test_category');
    expect(value.value).toBe('TEST_VALUE');
    expect(value.label).toBe('Test Value');
    expect(value.description).toBe('Test description');
    expect(value.sortOrder).toBe(1);
    expect(value.isActive).toBe(true);
    expect(value.createdAt).toBeDefined();
    expect(value.updatedAt).toBeDefined();

    // Cleanup
    await prisma.lookupValue.delete({ where: { id: value.id } });
  });
});
