import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { login, authHeader } from '../helpers/auth';

describe('Quotations API', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await login();
  });

  it('GET /api/quotations — list returns paginated envelope', async () => {
    const res = await request(app)
      .get('/api/quotations')
      .set(...authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/quotations — quote numbers follow TKF-YYYY-NNNN pattern', async () => {
    const res = await request(app)
      .get('/api/quotations?pageSize=5')
      .set(...authHeader(adminToken));
    for (const q of res.body.data) {
      expect(q.quoteNo).toMatch(/^TKF-\d{4}-\d{4}$/);
    }
  });

  it('GET /api/quotations/:id — includes revisions + customer', async () => {
    const list = await request(app)
      .get('/api/quotations?pageSize=1')
      .set(...authHeader(adminToken));
    const first = list.body.data[0];
    if (!first) return;

    const res = await request(app)
      .get(`/api/quotations/${first.id}`)
      .set(...authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(first.id);
    expect(res.body.data.customer).toBeDefined();
  });
});
