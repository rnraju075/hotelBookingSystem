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

import { UserModel } from '../../../src/modules/users/user.model.js';

import {
  USER_ROLES,
  USER_STATUSES,
} from '../../../src/modules/users/user.types.js';

describe('User API - Integration', () => {
  const app = createApp();

  const createUserInput = () => ({
    firstName: 'John',
    lastName: 'Doe',
    email: `user-integration-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}@example.com`,
    password: 'Password123!',
    phone: '1234567890',
  });

  beforeAll(async () => {
    await connectMongoDB();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({
      email: {
        $regex: /^user-integration-/,
      },
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: {
        $regex: /^user-integration-/,
      },
    });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ============================================================
  // POST /api/users
  // ============================================================

  describe('POST /api/users', () => {
    // ----------------------------------------------------------
    // 1. Successful creation
    // ----------------------------------------------------------

    it('should create a user successfully', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send(input);

      expect(response.status).toBe(201);

      expect(response.body.status).toBe(
        'success',
      );

      expect(
        response.body.data.user,
      ).toBeDefined();

      expect(
        response.body.data.user.id,
      ).toBeDefined();

      expect(
        response.body.data.user.firstName,
      ).toBe(input.firstName);

      expect(
        response.body.data.user.lastName,
      ).toBe(input.lastName);

      expect(
        response.body.data.user.email,
      ).toBe(input.email.toLowerCase());

      expect(
        response.body.data.user.phone,
      ).toBe(input.phone);

      expect(
        response.body.data.user.role,
      ).toBe(USER_ROLES.CUSTOMER);

      expect(
        response.body.data.user.status,
      ).toBe(USER_STATUSES.ACTIVE);

      expect(
        response.body.data.user.createdAt,
      ).toBeDefined();

      expect(
        response.body.data.user.updatedAt,
      ).toBeDefined();
    });

    // ----------------------------------------------------------
    // 2. Persist user in MongoDB
    // ----------------------------------------------------------

    it('should persist the created user in MongoDB', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send(input);

      expect(response.status).toBe(201);

      const storedUser =
        await UserModel.findOne({
          email: input.email,
        }).select('+passwordHash');

      expect(storedUser).not.toBeNull();

      expect(
        storedUser!.firstName,
      ).toBe(input.firstName);

      expect(
        storedUser!.lastName,
      ).toBe(input.lastName);

      expect(
        storedUser!.email,
      ).toBe(input.email);

      expect(
        storedUser!.phone,
      ).toBe(input.phone);

      expect(
        storedUser!.role,
      ).toBe(USER_ROLES.CUSTOMER);

      expect(
        storedUser!.status,
      ).toBe(USER_STATUSES.ACTIVE);

      expect(
        storedUser!.passwordHash,
      ).toBeDefined();

      expect(
        storedUser!.passwordHash,
      ).not.toBe(input.password);
    });

    // ----------------------------------------------------------
    // 3. Password is correctly hashed
    // ----------------------------------------------------------

    it('should hash the password before storing it', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send(input);

      expect(response.status).toBe(201);

      const storedUser =
        await UserModel.findOne({
          email: input.email,
        }).select('+passwordHash');

      expect(storedUser).not.toBeNull();

      expect(
        storedUser!.passwordHash,
      ).toBeDefined();

      const passwordMatches =
        await bcrypt.compare(
          input.password,
          storedUser!.passwordHash,
        );

      expect(passwordMatches).toBe(true);
    });

    // ----------------------------------------------------------
    // 4. Default role
    // ----------------------------------------------------------

    it('should use CUSTOMER as the default role', async () => {
      const input = createUserInput();

      delete (input as Partial<typeof input>).phone;

      const response = await request(app)
        .post('/api/users')
        .send(input);

      expect(response.status).toBe(201);

      expect(
        response.body.data.user.role,
      ).toBe(USER_ROLES.CUSTOMER);
    });

    // ----------------------------------------------------------
    // 5. Default status
    // ----------------------------------------------------------

    it('should use ACTIVE as the default status', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send(input);

      expect(response.status).toBe(201);

      expect(
        response.body.data.user.status,
      ).toBe(USER_STATUSES.ACTIVE);
    });

    // ----------------------------------------------------------
    // 6. Create HOTEL_MANAGER
    // ----------------------------------------------------------

    it('should create a HOTEL_MANAGER when a valid role is supplied', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          role: USER_ROLES.HOTEL_MANAGER,
        });

      expect(response.status).toBe(201);

      expect(
        response.body.data.user.role,
      ).toBe(USER_ROLES.HOTEL_MANAGER);
    });

    // ----------------------------------------------------------
    // 7. Create ADMIN
    // ----------------------------------------------------------

    it('should create an ADMIN when a valid role is supplied', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          role: USER_ROLES.ADMIN,
        });

      expect(response.status).toBe(201);

      expect(
        response.body.data.user.role,
      ).toBe(USER_ROLES.ADMIN);
    });

    // ----------------------------------------------------------
    // 8. Duplicate email
    // ----------------------------------------------------------

    it('should reject duplicate email', async () => {
      const input = createUserInput();

      const firstResponse =
        await request(app)
          .post('/api/users')
          .send(input);

      expect(firstResponse.status).toBe(201);

      const secondResponse =
        await request(app)
          .post('/api/users')
          .send(input);

      expect(secondResponse.status).toBe(409);

      expect(
        secondResponse.body.status,
      ).toBe('error');

      expect(
        secondResponse.body.code,
      ).toBe(
        'USER_EMAIL_ALREADY_EXISTS',
      );
    });

    // ----------------------------------------------------------
    // 9. Invalid email
    // ----------------------------------------------------------

    it('should reject an invalid email address', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    // ----------------------------------------------------------
    // 10. Missing first name
    // ----------------------------------------------------------

    it('should reject a missing first name', async () => {
      const input = createUserInput();

      const {
        firstName: _firstName,
        ...invalidInput
      } = input;

      const response = await request(app)
        .post('/api/users')
        .send(invalidInput);

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    // ----------------------------------------------------------
    // 11. First name too short
    // ----------------------------------------------------------

    it('should reject a first name shorter than 2 characters', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          firstName: 'J',
        });

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    // ----------------------------------------------------------
    // 12. Missing last name
    // ----------------------------------------------------------

    it('should reject a missing last name', async () => {
      const input = createUserInput();

      const {
        lastName: _lastName,
        ...invalidInput
      } = input;

      const response = await request(app)
        .post('/api/users')
        .send(invalidInput);

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    // ----------------------------------------------------------
    // 13. Password too short
    // ----------------------------------------------------------

    it('should reject a password shorter than 8 characters', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          password: '1234567',
        });

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    // ----------------------------------------------------------
    // 14. Password too long
    // ----------------------------------------------------------

    it('should reject a password longer than 72 characters', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          password: 'a'.repeat(73),
        });

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    // ----------------------------------------------------------
    // 15. Invalid role
    // ----------------------------------------------------------

    it('should reject an invalid role', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          role: 'INVALID_ROLE',
        });

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    // ----------------------------------------------------------
    // 16. Optional phone
    // ----------------------------------------------------------

    it('should create a user without a phone number', async () => {
      const input = createUserInput();

      const {
        phone: _phone,
        ...inputWithoutPhone
      } = input;

      const response = await request(app)
        .post('/api/users')
        .send(inputWithoutPhone);

      expect(response.status).toBe(201);

      expect(
        response.body.data.user,
      ).toBeDefined();

      expect(
        response.body.data.user.phone,
      ).toBeUndefined();
    });

    // ----------------------------------------------------------
    // 17. Email normalization
    // ----------------------------------------------------------

    it('should normalize the email to lowercase', async () => {
      const input = createUserInput();

      const mixedCaseEmail =
        `User-${Date.now()}@Example.COM`;

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          email: mixedCaseEmail,
        });

      expect(response.status).toBe(201);

      expect(
        response.body.data.user.email,
      ).toBe(
        mixedCaseEmail.toLowerCase(),
      );

      const storedUser =
        await UserModel.findOne({
          email: mixedCaseEmail.toLowerCase(),
        });

      expect(storedUser).not.toBeNull();
    });

    // ----------------------------------------------------------
    // 18. Trim names
    // ----------------------------------------------------------

    it('should trim first and last names', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          firstName: '  John  ',
          lastName: '  Doe  ',
        });

      expect(response.status).toBe(201);

      expect(
        response.body.data.user.firstName,
      ).toBe('John');

      expect(
        response.body.data.user.lastName,
      ).toBe('Doe');
    });

    // ----------------------------------------------------------
    // 19. Invalid phone
    // ----------------------------------------------------------

    it('should reject a phone number that is too short', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          phone: '123',
        });

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });

    // ----------------------------------------------------------
    // 20. Phone too long
    // ----------------------------------------------------------

    it('should reject a phone number that is too long', async () => {
      const input = createUserInput();

      const response = await request(app)
        .post('/api/users')
        .send({
          ...input,
          phone: '1'.repeat(21),
        });

      expect(response.status).toBe(400);

      expect(response.body.status).toBe(
        'error',
      );
    });
  });

  // ============================================================
  // UNKNOWN USER ROUTES
  // ============================================================

  describe('Unknown User API routes', () => {
    it('should return 404 for an unknown user route', async () => {
      const response = await request(app)
        .get('/api/users/does-not-exist');

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