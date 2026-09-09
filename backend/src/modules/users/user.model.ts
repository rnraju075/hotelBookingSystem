import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { USER_ROLES, USER_STATUSES, UserCredentials, type User } from './user.types.js';

export type UserPersistence = Omit<User, 'id' | 'createdAt' | 'updatedAt'> &
  UserCredentials & {
    createdAt: Date;
    updatedAt: Date;
  };
export type UserMongoDocument = HydratedDocument<UserPersistence>;

const userSchema = new Schema<UserPersistence>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel: Model<UserPersistence> = model<UserPersistence>('User', userSchema);
