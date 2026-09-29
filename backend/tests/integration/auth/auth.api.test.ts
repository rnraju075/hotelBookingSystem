import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import request from 'supertest';

import { createApp } from '../../../src/app/create-app.js';

import {
  connectMongoDB,
} from '../../../src/infrastructure/database/mongodb.js';

import {
  connectRedis,
  redisClient,
} from '../../../src/infrastructure/redis/redis.js';

import { UserModel } from '../../../src/modules/users/user.model.js';

import {
  USER_ROLES,
  USER_STATUSES,
} from '../../../src/modules/users/user.types.js';

import { env } from '../../../src/config/env.js';

describe('Auth API - Integration', () => {
  const app = createApp();

  const testPassword = 'Password123!';

  const testUser = {
    firstName: 'Auth',
    lastName: 'Integration',
    email: `auth-integration-${Date.now()}@example.com`,
    phone: '1234567890',
    role: USER_ROLES.CUSTOMER,
    status: USER_STATUSES.ACTIVE,
  };

  let userId: string;

  beforeAll(async () => {
    await connectMongoDB();

    if (!redisClient.isOpen) {
      await connectRedis();
    }
  });

  beforeEach(async () => {
    await UserModel.deleteMany({
      email: {
        $regex: /^auth-integration-/,
      },
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: {
        $regex: /^auth-integration-/,
      },
    });

    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ============================================================
  // HEALTH
  // ============================================================

  describe('GET /health', () => {
    it('should return API health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);

      expect(response.body.status).toBe('ok');

      expect(response.body.service).toBe(
        'hotel-booking-backend',
      );

      expect(response.body.environment).toBe(
        env.NODE_ENV,
      );

      expect(response.body.timestamp).toBeDefined();
    });
  });

  // ============================================================
  // LOGIN
  // ============================================================

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const passwordHash =
        await bcrypt.hash(
          testPassword,
          12,
        );

      const user =
        await UserModel.create({
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          email: testUser.email,
          phone: testUser.phone,
          passwordHash,
          role: testUser.role,
          status: testUser.status,
        });

      userId = user._id.toString();
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testPassword,
        });

      expect(response.status).toBe(200);

      expect(response.body.status).toBe(
        'success',
      );

      expect(
        response.body.data.user,
      ).toBeDefined();

      expect(
        response.body.data.user.id,
      ).toBe(userId);

      expect(
        response.body.data.user.email,
      ).toBe(testUser.email);

      expect(
        response.body.data.user.role,
      ).toBe(USER_ROLES.CUSTOMER);

      expect(
        response.body.data.user.status,
      ).toBe(USER_STATUSES.ACTIVE);

      expect(
        response.body.data.tokens,
      ).toBeDefined();

      expect(
        response.body.data.tokens.accessToken,
      ).toBeDefined();

      expect(
        response.body.data.tokens.refreshToken,
      ).toBeDefined();
    });

    it('should reject an incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);

      expect(response.body.status).toBe(
        'error',
      );

      expect(response.body.code).toBe(
        'INVALID_CREDENTIALS',
      );
    });

    it('should reject an unknown user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'does-not-exist@example.com',
          password: testPassword,
        });

      expect(response.status).toBe(401);

      expect(response.body.status).toBe(
        'error',
      );

      expect(response.body.code).toBe(
        'INVALID_CREDENTIALS',
      );
    });

    it('should reject a suspended user', async () => {
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            status: USER_STATUSES.SUSPENDED,
          },
        },
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testPassword,
        });

      expect(response.status).toBe(403);

      expect(response.body.status).toBe(
        'error',
      );

      expect(response.body.code).toBe(
        'USER_NOT_ACTIVE',
      );
    });

    it('should reject a deleted user', async () => {
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            status: USER_STATUSES.DELETED,
          },
        },
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testPassword,
        });

      expect(response.status).toBe(403);

      expect(response.body.status).toBe(
        'error',
      );

      expect(response.body.code).toBe(
        'USER_NOT_ACTIVE',
      );
    });

    it('should reject an invalid login request', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: '',
        });

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });
  });

  // ============================================================
  // GET /api/auth/me
  // ============================================================

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const passwordHash =
        await bcrypt.hash(
          testPassword,
          12,
        );

      const user =
        await UserModel.create({
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          email: testUser.email,
          phone: testUser.phone,
          passwordHash,
          role: USER_ROLES.HOTEL_MANAGER,
          status: USER_STATUSES.ACTIVE,
        });

      userId = user._id.toString();

      const loginResponse =
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testPassword,
          });

      expect(loginResponse.status).toBe(200);

      accessToken =
        loginResponse.body.data.tokens.accessToken;
    });

    it('should return the authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        );

      expect(response.status).toBe(200);

      expect(response.body.status).toBe(
        'success',
      );

      expect(
        response.body.data.user,
      ).toBeDefined();

      expect(
        response.body.data.user.id,
      ).toBe(userId);

      expect(
        response.body.data.user.role,
      ).toBe(USER_ROLES.HOTEL_MANAGER);

      expect(
        response.body.data.user.sessionId,
      ).toBeDefined();
    });

    it('should reject a request without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);

      expect(response.body.status).toBe(
        'error',
      );

      expect(response.body.code).toBe(
        'UNAUTHORIZED',
      );
    });

    it('should reject an invalid access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(
          'Authorization',
          'Bearer invalid-access-token',
        );

      expect(response.status).toBe(401);

      expect(response.body.status).toBe(
        'error',
      );
    });

    it('should reject an invalid authorization scheme', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(
          'Authorization',
          `Basic ${accessToken}`,
        );

      expect(response.status).toBe(401);

      expect(response.body.status).toBe(
        'error',
      );

      expect(response.body.code).toBe(
        'INVALID_AUTHORIZATION_HEADER',
      );
    });

    it('should reject an authorization header without a token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(
          'Authorization',
          'Bearer',
        );

      expect(response.status).toBe(401);

      expect(response.body.status).toBe(
        'error',
      );

      expect(response.body.code).toBe(
        'INVALID_AUTHORIZATION_HEADER',
      );
    });
  });

  // ============================================================
  // REFRESH
  // ============================================================

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const passwordHash =
        await bcrypt.hash(
          testPassword,
          12,
        );

      await UserModel.create({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        phone: testUser.phone,
        passwordHash,
        role: USER_ROLES.CUSTOMER,
        status: USER_STATUSES.ACTIVE,
      });

      const loginResponse =
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testPassword,
          });

      expect(loginResponse.status).toBe(200);

      refreshToken =
        loginResponse.body.data.tokens.refreshToken;
    });

    it('should generate new tokens with a valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);

      expect(response.body.status).toBe(
        'success',
      );

      expect(
        response.body.data.tokens.accessToken,
      ).toBeDefined();

      expect(
        response.body.data.tokens.refreshToken,
      ).toBeDefined();

      expect(
        response.body.data.tokens.refreshToken,
      ).not.toBe(refreshToken);
    });

    it('should reject an invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        });

      expect(response.status).toBe(401);

      expect(response.body.status).toBe(
        'error',
      );
    });

    it('should reject a missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    it('should reject the old refresh token after rotation', async () => {
      const firstResponse =
        await request(app)
          .post('/api/auth/refresh')
          .send({
            refreshToken,
          });

      expect(firstResponse.status).toBe(200);

      const secondResponse =
        await request(app)
          .post('/api/auth/refresh')
          .send({
            refreshToken,
          });

      expect(secondResponse.status).toBe(401);
    });
  });

  // ============================================================
  // LOGOUT
  // ============================================================

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const passwordHash =
        await bcrypt.hash(
          testPassword,
          12,
        );

      await UserModel.create({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        phone: testUser.phone,
        passwordHash,
        role: USER_ROLES.CUSTOMER,
        status: USER_STATUSES.ACTIVE,
      });

      const loginResponse =
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testPassword,
          });

      expect(loginResponse.status).toBe(200);

      refreshToken =
        loginResponse.body.data.tokens.refreshToken;
    });

    it('should logout successfully with a valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);

      expect(response.body.status).toBe(
        'success',
      );

      expect(response.body.message).toBe(
        'Logged out successfully.',
      );
    });

    it('should reject an invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken:
            'invalid-refresh-token',
        });

      expect(response.status).toBe(401);

      expect(response.body.status).toBe(
        'error',
      );
    });

    it('should reject a missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    it('should invalidate the refresh token after logout', async () => {
      const logoutResponse =
        await request(app)
          .post('/api/auth/logout')
          .send({
            refreshToken,
          });

      expect(logoutResponse.status).toBe(200);

      const refreshResponse =
        await request(app)
          .post('/api/auth/refresh')
          .send({
            refreshToken,
          });

      expect(refreshResponse.status).toBe(
        401,
      );
    });
  });

  // ============================================================
  // 404
  // ============================================================

  describe('Unknown routes', () => {
    it('should return 404 for an unknown route', async () => {
      const response = await request(app)
        .get('/api/auth/does-not-exist');

      expect(response.status).toBe(404);

      expect(response.body.status).toBe(
        'error',
      );

      expect(response.body.code).toBe(
        'NOT_FOUND',
      );
    });
  });
});