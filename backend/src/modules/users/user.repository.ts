import { UserModel, type UserMongoDocument } from './user.model.js';
import { User, UserCredentials, UserStatus } from './user.types.js';

type CreateUserPersistence = Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'> &
  UserCredentials;

export const userRepository = {
  async create(data: CreateUserPersistence): Promise<UserMongoDocument> {
    return UserModel.create(data);
  },

  async findByEmail(email: string, includePasswordHash = false): Promise<UserMongoDocument | null> {
    const query = UserModel.findOne({ email });

    if (includePasswordHash) {
      query.select('+passwordHash');
    }

    return query.exec();
  },

  async findById(id: string): Promise<UserMongoDocument | null> {
    return UserModel.findById(id).exec();
  },

  async findByIdPublic(id: string): Promise<UserMongoDocument | null> {
    return UserModel.findById(id).select('-passwordHash').exec();
  },
  async updateStatus(id: string, status: UserStatus): Promise<UserMongoDocument | null> {
    return UserModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      {
        new: true,
        runValidators: true,
      },
    ).exec();
  },

  async deleteById(id: string): Promise<UserMongoDocument | null> {
    return UserModel.findByIdAndDelete(id).exec();
  },
};
