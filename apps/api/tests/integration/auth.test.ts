import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { TEST_ADMIN, TEST_USER } from '../helpers/auth';

describe('POST /api/auth/login', () => {
  it('returns 200 + accessToken for valid admin credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(TEST_ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.user.email).toBe(TEST_ADMIN.email);
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('returns 200 for valid user credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(TEST_USER);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('USER');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'WrongPass123!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Whatever1!' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: TEST_ADMIN.email });
    expect([400, 422]).toContain(res.status);
  });
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
