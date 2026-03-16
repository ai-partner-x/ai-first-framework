import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { SecurityContext } from '@ai-partner-x/aiko-boot-starter-security';
import { createMockUser } from './test-helpers.js';

describe('API Test Helpers', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    app.get('/api/test', (req, res) => {
      res.json({ message: 'test' });
    });

    app.get('/api/auth', (req, res) => {
      const securityContext = SecurityContext.getInstance();
      const currentUser = securityContext.getCurrentUser();
      
      if (!currentUser) {
        return res.status(401).json({ error: '未授权' });
      }

      res.json({ user: currentUser });
    });

    app.post('/api/auth', (req, res) => {
      const { user } = req.body;
      SecurityContext.getInstance().setCurrentUser(user);
      res.json({ success: true });
    });

    app.delete('/api/auth', (req, res) => {
      SecurityContext.getInstance().setCurrentUser(null);
      res.json({ success: true });
    });
  });

  afterEach(() => {
    SecurityContext.getInstance().setCurrentUser(null);
  });

  describe('createAuthenticatedRequest', () => {
    it('应该创建已认证的请求', async () => {
      const mockUser = createMockUser();
      SecurityContext.getInstance().setCurrentUser(mockUser);

      const response = await request(app)
        .get('/api/auth')
        .expect(200);

      expect(response.body.user.username).toBe('testuser');
    });

    it('应该返回 401 当用户未认证', async () => {
      const response = await request(app)
        .get('/api/auth')
        .expect(401);

      expect(response.body).toHaveProperty('error', '未授权');
    });
  });

  describe('setupTestApp', () => {
    it('应该设置测试应用', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'test');
    });
  });
});

export async function createAuthenticatedRequest(
  app: express.Application,
  method: string,
  path: string,
  user: any,
  body?: any
) {
  SecurityContext.getInstance().setCurrentUser(user);

  const requestBuilder = (request(app) as any)[method.toLowerCase()](path);

  if (body) {
    requestBuilder.send(body);
  }

  return requestBuilder;
}

export function setupTestApp(handlers: any): express.Application {
  const app = express();
  app.use(express.json());

  for (const [path, handler] of Object.entries(handlers)) {
    const [method, route] = path.split(' ');
    (app as any)[method.toLowerCase()](route, handler);
  }

  return app;
}

export function createTestServer(port: number): express.Application {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', port });
  });

  return app;
}
