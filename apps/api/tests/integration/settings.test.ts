import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { login, authHeader, TEST_USER } from '../helpers/auth';

describe('Settings API', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = await login();
    userToken = await login(TEST_USER);
  });

  it('GET /api/settings — admin gets settings + integrations', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set(...authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('settings');
    expect(res.body.data).toHaveProperty('integrations');
    expect(res.body.data).toHaveProperty('aiProviders');
    expect(Array.isArray(res.body.data.aiProviders)).toBe(true);
    expect(res.body.data.aiProviders.length).toBe(4);
  });

  it('GET /api/settings — non-admin 403', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set(...authHeader(userToken));
    expect(res.status).toBe(403);
  });

  it('PATCH /api/settings — rejects unknown key', async () => {
    const res = await request(app)
      .patch('/api/settings')
      .set(...authHeader(adminToken))
      .send({ key: 'totally.fake.key', value: true });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/settings — allow-listed key persists', async () => {
    const res = await request(app)
      .patch('/api/settings')
      .set(...authHeader(adminToken))
      .send({ key: 'notifications.enabled', value: true });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ key: 'notifications.enabled', value: true });

    // Readback
    const get = await request(app)
      .get('/api/settings')
      .set(...authHeader(adminToken));
    expect(get.body.data.settings['notifications.enabled']).toBe(true);
  });

  it('GET /api/settings/ai-usage — admin sees aggregated report', async () => {
    const res = await request(app)
      .get('/api/settings/ai-usage?days=7')
      .set(...authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totals');
    expect(res.body.data).toHaveProperty('byProvider');
    expect(res.body.data).toHaveProperty('byTask');
    expect(Array.isArray(res.body.data.recent)).toBe(true);
  });

  it('GET /api/ai/status — returns current provider', async () => {
    const res = await request(app)
      .get('/api/ai/status')
      .set(...authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('provider');
  });
});
