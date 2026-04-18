import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { login, authHeader, TEST_ADMIN, TEST_USER } from '../helpers/auth';

describe('Customers API', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = await login(TEST_ADMIN);
    userToken = await login(TEST_USER);
  });

  it('GET /api/customers — admin can list', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set(...authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/customers — non-admin sees same records (PRD compliance)', async () => {
    const adminRes = await request(app)
      .get('/api/customers?pageSize=100')
      .set(...authHeader(adminToken));
    const userRes = await request(app)
      .get('/api/customers?pageSize=100')
      .set(...authHeader(userToken));
    expect(userRes.status).toBe(200);
    expect(userRes.body.total).toBe(adminRes.body.total);
  });

  it('GET /api/customers without token returns 401', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
  });

  it('POST /api/customers/conflict-check — detects duplicate by company name', async () => {
    const first = await request(app)
      .get('/api/customers?pageSize=1')
      .set(...authHeader(adminToken));
    const existing = first.body.data[0];
    if (!existing) {
      console.warn('No existing customer — skipping conflict test');
      return;
    }

    const res = await request(app)
      .post('/api/customers/conflict-check')
      .set(...authHeader(adminToken))
      .send({ companyName: existing.companyName, phone: '', email: '' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const match = res.body.data.find((m: { customerId: number }) => m.customerId === existing.id);
    expect(match).toBeDefined();
    expect(match.similarity).toBeGreaterThanOrEqual(80);
  });

  it('POST /api/customers/conflict-check — returns empty for unique name', async () => {
    const uniqueName = `Completely Unique Test Company ${Date.now()}`;
    const res = await request(app)
      .post('/api/customers/conflict-check')
      .set(...authHeader(adminToken))
      .send({ companyName: uniqueName, phone: '', email: '' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
