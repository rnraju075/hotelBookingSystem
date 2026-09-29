import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import mongoose from 'mongoose';

import { connectMongoDB } from '../../../src/infrastructure/database/mongodb.js';

import { UserModel } from '../../../src/modules/users/user.model.js';

import { userRepository } from '../../../src/modules/users/user.repository.js';

import {
  USER_ROLES,
  USER_STATUSES,
} from '../../../src/modules/users/user.types.js';

describe('UserRepository - MongoDB Integration', () => {
  beforeAll(async () => {
    await connectMongoDB();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await UserModel.deleteMany({});

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ============================================================
  // CREATE
  // ============================================================

  describe('create()', () => {
    it('should create and persist a user in MongoDB', async () => {
      const user = await userRepository.create({
        firstName: 'Deepthi',
        lastName: 'Test',
        email: 'deepthi@example.com',
        phone: '1234567890',
        passwordHash: 'hashed-password',
      });

      expect(user).toBeDefined();

      expect(user._id).toBeDefined();

      expect(user.firstName).toBe('Deepthi');

      expect(user.lastName).toBe('Test');

      expect(user.email).toBe(
        'deepthi@example.com',
      );

      expect(user.phone).toBe(
        '1234567890',
      );

      expect(user.passwordHash).toBe(
        'hashed-password',
      );

      expect(user.role).toBe(
        USER_ROLES.CUSTOMER,
      );

      expect(user.status).toBe(
        USER_STATUSES.ACTIVE,
      );
    });

    it('should persist the user so it can be retrieved from MongoDB', async () => {
      const createdUser =
        await userRepository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          passwordHash: 'hashed-password',
        });

      const savedUser =
        await UserModel.findById(
          createdUser._id,
        ).select('+passwordHash');

      expect(savedUser).not.toBeNull();

      expect(savedUser?.email).toBe(
        'john@example.com',
      );

      expect(savedUser?.passwordHash).toBe(
        'hashed-password',
      );
    });

    it('should use CUSTOMER and ACTIVE as default values', async () => {
      const user =
        await userRepository.create({
          firstName: 'Default',
          lastName: 'User',
          email: 'default@example.com',
          passwordHash: 'hashed-password',
        });

      expect(user.role).toBe(
        USER_ROLES.CUSTOMER,
      );

      expect(user.status).toBe(
        USER_STATUSES.ACTIVE,
      );
    });
  });

  // ============================================================
  // findByEmail()
  // ============================================================

  describe('findByEmail()', () => {
    it('should find an existing user by email', async () => {
      await userRepository.create({
        firstName: 'Deepthi',
        lastName: 'Test',
        email: 'deepthi@example.com',
        passwordHash: 'hashed-password',
      });

      const user =
        await userRepository.findByEmail(
          'deepthi@example.com',
        );

      expect(user).not.toBeNull();

      expect(user?.email).toBe(
        'deepthi@example.com',
      );

      expect(user?.firstName).toBe(
        'Deepthi',
      );
    });

    it('should return null when email does not exist', async () => {
      const user =
        await userRepository.findByEmail(
          'missing@example.com',
        );

      expect(user).toBeNull();
    });

    it('should not return passwordHash by default', async () => {
      await userRepository.create({
        firstName: 'Deepthi',
        lastName: 'Test',
        email: 'public@example.com',
        passwordHash: 'secret-hash',
      });

      const user =
        await userRepository.findByEmail(
          'public@example.com',
        );

      expect(user).not.toBeNull();

      expect(user?.passwordHash).toBeUndefined();
    });

    it('should return passwordHash when explicitly requested', async () => {
      await userRepository.create({
        firstName: 'Deepthi',
        lastName: 'Test',
        email: 'private@example.com',
        passwordHash: 'secret-hash',
      });

      const user =
        await userRepository.findByEmail(
          'private@example.com',
          true,
        );

      expect(user).not.toBeNull();

      expect(user?.passwordHash).toBe(
        'secret-hash',
      );
    });
  });

  // ============================================================
  // findById()
  // ============================================================

  describe('findById()', () => {
    it('should find a user by MongoDB ID', async () => {
      const createdUser =
        await userRepository.create({
          firstName: 'Deepthi',
          lastName: 'Test',
          email: 'byid@example.com',
          passwordHash: 'hashed-password',
        });

      const user =
        await userRepository.findById(
          createdUser._id.toString(),
        );

      expect(user).not.toBeNull();

      expect(user?._id.toString()).toBe(
        createdUser._id.toString(),
      );

      expect(user?.email).toBe(
        'byid@example.com',
      );
    });

    it('should return null for a non-existing ID', async () => {
      const fakeId =
        new mongoose.Types.ObjectId().toString();

      const user =
        await userRepository.findById(
          fakeId,
        );

      expect(user).toBeNull();
    });
  });

  // ============================================================
  // findByIdPublic()
  // ============================================================

  describe('findByIdPublic()', () => {
    it('should return the user without passwordHash', async () => {
      const createdUser =
        await userRepository.create({
          firstName: 'Deepthi',
          lastName: 'Public',
          email: 'public-id@example.com',
          passwordHash: 'secret-hash',
        });

      const user =
        await userRepository.findByIdPublic(
          createdUser._id.toString(),
        );

      expect(user).not.toBeNull();

      expect(user?.firstName).toBe(
        'Deepthi',
      );

      expect(user?.email).toBe(
        'public-id@example.com',
      );

      expect(user?.passwordHash).toBeUndefined();
    });

    it('should return null for a non-existing ID', async () => {
      const fakeId =
        new mongoose.Types.ObjectId().toString();

      const user =
        await userRepository.findByIdPublic(
          fakeId,
        );

      expect(user).toBeNull();
    });
  });

  // ============================================================
  // updateStatus()
  // ============================================================

  describe('updateStatus()', () => {
    it('should update ACTIVE user to SUSPENDED', async () => {
      const createdUser =
        await userRepository.create({
          firstName: 'Deepthi',
          lastName: 'Status',
          email: 'status@example.com',
          passwordHash: 'hashed-password',
        });

      const updatedUser =
        await userRepository.updateStatus(
          createdUser._id.toString(),
          USER_STATUSES.SUSPENDED,
        );

      expect(updatedUser).not.toBeNull();

      expect(updatedUser?.status).toBe(
        USER_STATUSES.SUSPENDED,
      );

      expect(updatedUser?.email).toBe(
        'status@example.com',
      );
    });

    it('should update SUSPENDED user back to ACTIVE', async () => {
      const createdUser =
        await userRepository.create({
          firstName: 'Deepthi',
          lastName: 'Status',
          email: 'status-active@example.com',
          passwordHash: 'hashed-password',
        });

      await userRepository.updateStatus(
        createdUser._id.toString(),
        USER_STATUSES.SUSPENDED,
      );

      const updatedUser =
        await userRepository.updateStatus(
          createdUser._id.toString(),
          USER_STATUSES.ACTIVE,
        );

      expect(updatedUser).not.toBeNull();

      expect(updatedUser?.status).toBe(
        USER_STATUSES.ACTIVE,
      );
    });

    it('should return null when updating a non-existing user', async () => {
      const fakeId =
        new mongoose.Types.ObjectId().toString();

      const updatedUser =
        await userRepository.updateStatus(
          fakeId,
          USER_STATUSES.SUSPENDED,
        );

      expect(updatedUser).toBeNull();
    });
  });

  // ============================================================
  // deleteById()
  // ============================================================

  describe('deleteById()', () => {
    it('should delete an existing user', async () => {
      const createdUser =
        await userRepository.create({
          firstName: 'Delete',
          lastName: 'Test',
          email: 'delete@example.com',
          passwordHash: 'hashed-password',
        });

      const deletedUser =
        await userRepository.deleteById(
          createdUser._id.toString(),
        );

      expect(deletedUser).not.toBeNull();

      expect(deletedUser?.email).toBe(
        'delete@example.com',
      );

      const userAfterDelete =
        await userRepository.findById(
          createdUser._id.toString(),
        );

      expect(userAfterDelete).toBeNull();
    });

    it('should return null when deleting a non-existing user', async () => {
      const fakeId =
        new mongoose.Types.ObjectId().toString();

      const deletedUser =
        await userRepository.deleteById(
          fakeId,
        );

      expect(deletedUser).toBeNull();
    });
  });

  // ============================================================
  // DUPLICATE EMAIL
  // ============================================================

  describe('duplicate email', () => {
    it('should reject duplicate email when the email is unique', async () => {
      await userRepository.create({
        firstName: 'First',
        lastName: 'User',
        email: 'duplicate@example.com',
        passwordHash: 'hash-one',
      });

      await expect(
        userRepository.create({
          firstName: 'Second',
          lastName: 'User',
          email: 'duplicate@example.com',
          passwordHash: 'hash-two',
        }),
      ).rejects.toThrow();
    });
  });
});