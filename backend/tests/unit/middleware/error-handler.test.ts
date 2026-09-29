import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type {
  Request,
  Response,
} from 'express';

import { AppError } from '../../../src/shared/errors/app-error.js';

import { errorHandler } from '../../../src/shared/middleware/error-handler.js';

describe('errorHandler middleware', () => {
  const request =
    {} as Request;

  const next = vi.fn();

  let response: Response;

  beforeEach(() => {
    vi.clearAllMocks();

    response = {
      headersSent: false,
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
  });

  // ============================================================
  // APP ERROR
  // ============================================================

  it('should handle an AppError', () => {
    const error = new AppError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed.',
    );

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(400);

    expect(
      response.json,
    ).toHaveBeenCalledWith({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message:
        'Request validation failed.',
    });
  });

  // ============================================================
  // 401 ERROR
  // ============================================================

  it('should return 401 for an unauthorized AppError', () => {
    const error = new AppError(
      401,
      'UNAUTHORIZED',
      'Authentication is required.',
    );

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(401);

    expect(
      response.json,
    ).toHaveBeenCalledWith({
      status: 'error',
      code: 'UNAUTHORIZED',
      message:
        'Authentication is required.',
    });
  });

  // ============================================================
  // 403 ERROR
  // ============================================================

  it('should return 403 for a forbidden AppError', () => {
    const error = new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to perform this action.',
    );

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(403);

    expect(
      response.json,
    ).toHaveBeenCalledWith({
      status: 'error',
      code: 'FORBIDDEN',
      message:
        'You do not have permission to perform this action.',
    });
  });

  // ============================================================
  // 404 ERROR
  // ============================================================

  it('should return 404 for a not-found AppError', () => {
    const error = new AppError(
      404,
      'NOT_FOUND',
      'Resource not found.',
    );

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(404);

    expect(
      response.json,
    ).toHaveBeenCalledWith({
      status: 'error',
      code: 'NOT_FOUND',
      message:
        'Resource not found.',
    });
  });

  // ============================================================
  // 409 ERROR
  // ============================================================

  it('should return 409 for a conflict AppError', () => {
    const error = new AppError(
      409,
      'USER_EMAIL_ALREADY_EXISTS',
      'A user with this email already exists.',
    );

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(409);

    expect(
      response.json,
    ).toHaveBeenCalledWith({
      status: 'error',
      code:
        'USER_EMAIL_ALREADY_EXISTS',
      message:
        'A user with this email already exists.',
    });
  });

  // ============================================================
  // UNKNOWN ERROR
  // ============================================================

  it('should return 500 for an unknown error', () => {
    const error = new Error(
      'Unexpected database failure',
    );

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(500);

    expect(
      response.json,
    ).toHaveBeenCalledWith({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Internal server error',
    });
  });

  // ============================================================
  // UNKNOWN THROWABLE
  // ============================================================

  it('should return 500 for a non-Error throwable', () => {
    const error = 'unexpected failure';

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).toHaveBeenCalledWith(500);

    expect(
      response.json,
    ).toHaveBeenCalledWith({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Internal server error',
    });
  });

  // ============================================================
  // HEADERS ALREADY SENT
  // ============================================================

  it('should not send a response when headers have already been sent', () => {
    response.headersSent = true;

    const error = new AppError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed.',
    );

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(
      response.status,
    ).not.toHaveBeenCalled();

    expect(
      response.json,
    ).not.toHaveBeenCalled();
  });

  // ============================================================
  // NEXT IS NOT CALLED
  // ============================================================

  it('should not call next when handling an error', () => {
    const error = new AppError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed.',
    );

    errorHandler(
      error,
      request,
      response,
      next,
    );

    expect(next).not.toHaveBeenCalled();
  });
});