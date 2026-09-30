
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

vi.mock(
  '../../../src/shared/security/jwt.js',
  () => ({
    verifyAccessToken: vi.fn(),
  }),
);

import { verifyAccessToken } from '../../../src/shared/security/jwt.js';

import { authenticate } from '../../../src/shared/middleware/authenticate.js';

describe('authenticate middleware', () => {
  const createRequest = (
    authorization?: string,
  ): Request =>
    ({
      headers: {
        ...(authorization
          ? { authorization }
          : {}),
      },
    }) as Request;

  const response = {} as Response;

  const next = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // MISSING AUTHORIZATION
  // ============================================================

  it('should reject a request without an authorization header', () => {
    const req = createRequest();

    expect(() =>
      authenticate(req, response, next),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();

    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  // ============================================================
  // INVALID AUTHORIZATION SCHEME
  // ============================================================

  it('should reject a non-Bearer authorization scheme', () => {
    const req = createRequest(
      'Basic some-token',
    );

    expect(() =>
      authenticate(req, response, next),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();

    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  // ============================================================
  // MISSING TOKEN
  // ============================================================

  it('should reject a Bearer header without a token', () => {
    const req = createRequest('Bearer');

    expect(() =>
      authenticate(req, response, next),
    ).toThrow(AppError);

    expect(next).not.toHaveBeenCalled();

    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  // ============================================================
  // INVALID TOKEN
  // ============================================================

  it('should reject an invalid access token', () => {
    const req = createRequest(
      'Bearer invalid-token',
    );

    vi.mocked(
      verifyAccessToken,
    ).mockImplementation(() => {
      throw new Error(
        'Invalid token',
      );
    });

    expect(() =>
      authenticate(req, response, next),
    ).toThrow(AppError);

    expect(
      verifyAccessToken,
    ).toHaveBeenCalledWith(
      'invalid-token',
    );

    expect(next).not.toHaveBeenCalled();
  });

  // ============================================================
  // VALID TOKEN
  // ============================================================

  it('should authenticate a valid access token', () => {
    const req = createRequest(
      'Bearer valid-access-token',
    );

    vi.mocked(
      verifyAccessToken,
    ).mockReturnValue({
      sub: 'user-123',
      role: 'HOTEL_MANAGER',
      sid: 'session-123',
    });

    authenticate(
      req,
      response,
      next,
    );

    expect(
      verifyAccessToken,
    ).toHaveBeenCalledWith(
      'valid-access-token',
    );

    expect(req.user).toEqual({
      id: 'user-123',
      role: 'HOTEL_MANAGER',
      sessionId: 'session-123',
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // CUSTOMER
  // ============================================================

  it('should authenticate a CUSTOMER token', () => {
    const req = createRequest(
      'Bearer customer-token',
    );

    vi.mocked(
      verifyAccessToken,
    ).mockReturnValue({
      sub: 'customer-123',
      role: 'CUSTOMER',
      sid: 'session-customer',
    });

    authenticate(
      req,
      response,
      next,
    );

    expect(req.user).toEqual({
      id: 'customer-123',
      role: 'CUSTOMER',
      sessionId: 'session-customer',
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // ADMIN
  // ============================================================

  it('should authenticate an ADMIN token', () => {
    const req = createRequest(
      'Bearer admin-token',
    );

    vi.mocked(
      verifyAccessToken,
    ).mockReturnValue({
      sub: 'admin-123',
      role: 'ADMIN',
      sid: 'session-admin',
    });

    authenticate(
      req,
      response,
      next,
    );

    expect(req.user).toEqual({
      id: 'admin-123',
      role: 'ADMIN',
      sessionId: 'session-admin',
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // EXTRA AUTHORIZATION DATA
  // ============================================================

  it('should extract only the token from the Bearer header', () => {
    const req = createRequest(
      'Bearer valid-token extra-data',
    );

    vi.mocked(
      verifyAccessToken,
    ).mockReturnValue({
      sub: 'user-123',
      role: 'CUSTOMER',
      sid: 'session-123',
    });

    authenticate(
      req,
      response,
      next,
    );

    expect(
      verifyAccessToken,
    ).toHaveBeenCalledWith(
      'valid-token',
    );

    expect(next).toHaveBeenCalledTimes(1);
  });
});