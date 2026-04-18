import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { login, authHeader, TEST_USER } from '../helpers/auth';

describe('Audit + Transfers + RBAC', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = await login();
    userToken = await login(TEST_USER);
  });

  it('GET /api/audit — admin sees audit log', async () => {
    const res = await request(app)
      .get('/api/audit?pageSize=5')
      .set(...authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/audit — non-admin gets 403', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set(...authHeader(userToken));
    expect(res.status).toBe(403);
  });

  it('POST /api/transfers/preview — admin can preview', async () => {
    const users = await request(app)
      .get('/api/users')
      .set(...authHeader(adminToken));
    const candidates = users.body.data.filter((u: { role: string }) => u.role === 'USER');
    if (candidates.length < 2) return;

    const res = await request(app)
      .post('/api/transfers/preview')
      .set(...authHeader(adminToken))
      .send({
        sourceUserId: candidates[0].id,
        targetUserId: candidates[1].id,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.sourceUser.id).toBe(candidates[0].id);
    expect(res.body.data.targetUser.id).toBe(candidates[1].id);
    expect(res.body.data.affectedRecords).toHaveProperty('customers');
    expect(res.body.data.affectedRecords).toHaveProperty('quotations');
  });

  it('POST /api/transfers/preview — non-admin gets 403', async () => {
    const res = await request(app)
      .post('/api/transfers/preview')
      .set(...authHeader(userToken))
      .send({ sourceUserId: 1, targetUserId: 2 });
    expect(res.status).toBe(403);
  });

  it('GET /api/reports/* — non-admin cannot export', async () => {
    const res = await request(app)
      .get('/api/reports/periodic?format=excel')
      .set(...authHeader(userToken));
    expect(res.status).toBe(403);
  });
});
