import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserService } from '../../../src/modules/users/user.service.js';
import { userRepository } from '../../../src/modules/users/user.repository.js';


vi.mock('../../../src/modules/users/user.repository.js', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
}));

describe('UserService.createUser', () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();

    userService = new UserService();
  });

  it('should create a user successfully', async () => {
    vi.mocked(userRepository.findByEmail)
      .mockResolvedValue(null);

    vi.mocked(userRepository.create)
      .mockResolvedValue({
        _id: {
          toString: () => 'user-123',
        },
        firstName: 'Deepthi',
        lastName: 'Test',
        email: 'deepthi@example.com',
        passwordHash: 'hashed-password',
        phone: '1234567890',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

    const result = await userService.createUser({
      firstName: 'Deepthi',
      lastName: 'Test',
      email: '  DEEPTHI@EXAMPLE.COM ',
      password: 'Password@123',
      phone: '1234567890',
    });

    expect(userRepository.findByEmail)
      .toHaveBeenCalledWith(
        'deepthi@example.com',
      );

    expect(userRepository.create)
      .toHaveBeenCalled();

    expect(result.email)
      .toBe('deepthi@example.com');

    expect(result.firstName)
      .toBe('Deepthi');

    expect(result.role)
      .toBe('CUSTOMER');

    expect(result)
      .not.toHaveProperty('passwordHash');
  });

  it('should reject duplicate email', async () => {
    vi.mocked(userRepository.findByEmail)
      .mockResolvedValue({
        _id: 'existing-user',
      } as any);

    await expect(
      userService.createUser({
        firstName: 'Deepthi',
        lastName: 'Test',
        email: 'deepthi@example.com',
        password: 'Password@123',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'USER_EMAIL_ALREADY_EXISTS',
    });

    expect(userRepository.create)
      .not.toHaveBeenCalled();
  });
});