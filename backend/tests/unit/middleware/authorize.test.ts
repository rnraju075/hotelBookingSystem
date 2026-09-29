import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import { AppError } from '../../../src/shared/errors/app-error.js';

import {
  requireRole,
} from '../../../src/shared/middleware/authorize.js';

describe('authorize middleware', () => {
  const response = {} as Response;

  const next = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (
    user?: {
      id: string;
      role:
        | 'CUSTOMER'
        | 'HOTEL_MANAGER'
        | 'ADMIN';
      sessionId: string;
    },
  ): Request =>
    ({
      user,
    }) as Request;

  // ============================================================
  // NO AUTHENTICATED USER
  // ============================================================

  it('should reject an unauthenticated request', () => {
    const req = createRequest();

    const middleware =
      requireRole('ADMIN');

    expect(() =>
      middleware(
        req,
        response,
        next,
      ),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();
  });

  // ============================================================
  // ADMIN
  // ============================================================

  it('should allow ADMIN when ADMIN role is required', () => {
    const req = createRequest({
      id: 'admin-123',
      role: 'ADMIN',
      sessionId: 'session-admin',
    });

    const middleware =
      requireRole('ADMIN');

    middleware(
      req,
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // HOTEL MANAGER
  // ============================================================

  it('should allow HOTEL_MANAGER when HOTEL_MANAGER role is required', () => {
    const req = createRequest({
      id: 'manager-123',
      role: 'HOTEL_MANAGER',
      sessionId: 'session-manager',
    });

    const middleware =
      requireRole('HOTEL_MANAGER');

    middleware(
      req,
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // CUSTOMER
  // ============================================================

  it('should allow CUSTOMER when CUSTOMER role is required', () => {
    const req = createRequest({
      id: 'customer-123',
      role: 'CUSTOMER',
      sessionId: 'session-customer',
    });

    const middleware =
      requireRole('CUSTOMER');

    middleware(
      req,
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // WRONG ROLE
  // ============================================================

  it('should reject CUSTOMER when ADMIN role is required', () => {
    const req = createRequest({
      id: 'customer-123',
      role: 'CUSTOMER',
      sessionId: 'session-customer',
    });

    const middleware =
      requireRole('ADMIN');

    expect(() =>
      middleware(
        req,
        response,
        next,
      ),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();
  });

  it('should reject HOTEL_MANAGER when ADMIN role is required', () => {
    const req = createRequest({
      id: 'manager-123',
      role: 'HOTEL_MANAGER',
      sessionId: 'session-manager',
    });

    const middleware =
      requireRole('ADMIN');

    expect(() =>
      middleware(
        req,
        response,
        next,
      ),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();
  });

  it('should reject ADMIN when CUSTOMER role is required', () => {
    const req = createRequest({
      id: 'admin-123',
      role: 'ADMIN',
      sessionId: 'session-admin',
    });

    const middleware =
      requireRole('CUSTOMER');

    expect(() =>
      middleware(
        req,
        response,
        next,
      ),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();
  });

  // ============================================================
  // MULTIPLE ALLOWED ROLES
  // ============================================================

  it('should allow a user when their role is one of multiple allowed roles', () => {
    const req = createRequest({
      id: 'manager-123',
      role: 'HOTEL_MANAGER',
      sessionId: 'session-manager',
    });

    const middleware =
      requireRole(
        'ADMIN',
        'HOTEL_MANAGER',
      );

    middleware(
      req,
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should reject a user whose role is not among multiple allowed roles', () => {
    const req = createRequest({
      id: 'customer-123',
      role: 'CUSTOMER',
      sessionId: 'session-customer',
    });

    const middleware =
      requireRole(
        'ADMIN',
        'HOTEL_MANAGER',
      );

    expect(() =>
      middleware(
        req,
        response,
        next,
      ),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();
  });

  // ============================================================
  // NO ALLOWED ROLES
  // ============================================================

  it('should reject an authenticated user when no roles are allowed', () => {
    const req = createRequest({
      id: 'user-123',
      role: 'CUSTOMER',
      sessionId: 'session-123',
    });

    const middleware =
      requireRole();

    expect(() =>
      middleware(
        req,
        response,
        next,
      ),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();
  });

  // ============================================================
  // NEXT SHOULD ONLY BE CALLED ONCE
  // ============================================================

  it('should call next exactly once for an authorized user', () => {
    const req = createRequest({
      id: 'admin-123',
      role: 'ADMIN',
      sessionId: 'session-admin',
    });

    const middleware =
      requireRole('ADMIN');

    middleware(
      req,
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });
});