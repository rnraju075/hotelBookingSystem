import 'dotenv/config';

import mongoose from 'mongoose';

import { connectMongoDB } from '../src/infrastructure/database/mongodb.js';
import { userRepository } from '../src/modules/users/user.repository.js';

const run = async (): Promise<void> => {
  try {
    await connectMongoDB();

    console.log('\n--- Creating user ---');

    const user = await userRepository.create({
      firstName: 'John',
      lastName: 'Doe',
      email: `john.${Date.now()}@example.com`,
      passwordHash: 'temporary-hash-for-testing',
      phone: '+1234567890',
    });

    console.log('Created user:', {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
    });

    console.log('\n--- Finding user by email ---');

    const foundByEmail = await userRepository.findByEmail(user.email);

    console.log('Found by email:', {
      id: foundByEmail?._id.toString(),
      email: foundByEmail?.email,
      passwordHash: foundByEmail?.passwordHash,
    });

    console.log('\n--- Finding user by email with password hash ---');

    const foundForAuthentication = await userRepository.findByEmail(user.email, true);

    console.log('Authentication user:', {
      id: foundForAuthentication?._id.toString(),
      email: foundForAuthentication?.email,
      hasPasswordHash: Boolean(foundForAuthentication?.passwordHash),
    });

    console.log('\n--- Finding user by ID ---');

    const foundById = await userRepository.findById(user._id.toString());

    console.log('Found by ID:', {
      id: foundById?._id.toString(),
      email: foundById?.email,
    });

    console.log('\n--- Finding public user ---');

    const publicUser = await userRepository.findByIdPublic(user._id.toString());

    console.log('Public user:', {
      id: publicUser?._id.toString(),
      email: publicUser?.email,
      passwordHash: publicUser?.passwordHash,
    });

    console.log('\n--- Deleting test user ---');

    await user.deleteOne();

    console.log('Test user deleted successfully.');
  } catch (error) {
    console.error('Repository test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

await run();
