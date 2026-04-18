import request from 'supertest';
import { app } from '../../src/app';

export interface TestUser {
  email: string;
  password: string;
}

export const TEST_ADMIN: TestUser = {
  email: 'admin@nakliyecrm.com',
  password: 'Admin123!',
};

export const TEST_USER: TestUser = {
  email: 'ahmet@nakliyecrm.com',
  password: 'User123!',
};

export async function login(user: TestUser = TEST_ADMIN): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });

  if (res.status !== 200 || !res.body?.data?.accessToken) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken as string;
}

export function authHeader(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}
