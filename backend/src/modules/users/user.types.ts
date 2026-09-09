export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  HOTEL_MANAGER: 'HOTEL_MANAGER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_STATUSES = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type UserStatus =
  (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  passwordHash: string;
}