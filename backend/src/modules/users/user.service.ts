import bcrypt from 'bcrypt';

import { userRepository } from './user.repository.js';
import type { User } from './user.types.js';
import { AppError } from '../../shared/errors/app-error.js';
import { CreateUserInput } from './user.schema.js';

export class UserService {
  async createUser(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();

    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError(
        409,
        'USER_EMAIL_ALREADY_EXISTS',
        'A user with this email already exists.',
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await userRepository.create({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      passwordHash,
      ...(input.phone ? { phone: input.phone.trim() } : {}),
    });

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      ...(user.phone ? { phone: user.phone } : {}),
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userService = new UserService();
