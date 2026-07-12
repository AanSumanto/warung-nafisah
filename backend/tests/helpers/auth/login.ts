import { expect } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

export interface LoginSuccessBody {
  success: true;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

/** Login and assert API contract before returning token. */
export async function loginAndGetToken(
  app: Express,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data).toBeDefined();
  expect(res.body.data.token).toBeDefined();

  const body = res.body as LoginSuccessBody;
  return body.data.token;
}
