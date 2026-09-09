import 'dotenv/config';

import mongoose from 'mongoose';

import { connectMongoDB } from '../src/infrastructure/database/mongodb.js';
import { userService } from '../src/modules/users/user.service.js';
import { UserModel } from '../src/modules/users/user.model.js';

const run = async (): Promise<void> => {
  try {
    await connectMongoDB();

    const email = `service-test-${Date.now()}@example.com`;

    console.log('\n--- Creating user through service ---');

    const user = await userService.createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email,
      password: 'TestPassword123!',
      phone: '+1234567890',
    });

    console.log('Created user:', user);

    console.log(
      '\nPassword hash exposed?',
      'passwordHash' in user,
    );

    console.log('\n--- Checking duplicate email ---');

    try {
      await userService.createUser({
        firstName: 'Jane',
        lastName: 'Duplicate',
        email,
        password: 'AnotherPassword123!',
      });
    } catch (error) {
      console.log('Duplicate check:', error);
    }

    await UserModel.deleteOne({ email });

    console.log('\nTest user deleted successfully.');
  } catch (error) {
    console.error('User service test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

await run();