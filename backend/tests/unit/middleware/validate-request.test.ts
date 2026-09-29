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

import { z } from 'zod';

import { AppError } from '../../../src/shared/errors/app-error.js';

import { validateRequest } from '../../../src/shared/middleware/validate-request.js';

describe('validateRequest middleware', () => {
  const response = {} as Response;

  const next = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (
    body: unknown,
  ): Request =>
    ({
      body,
    }) as Request;

  // ============================================================
  // VALID REQUEST
  // ============================================================

  it('should call next when the request body is valid', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const req = createRequest({
      email: 'john@example.com',
      password: 'Password123!',
    });

    const middleware =
      validateRequest(schema);

    middleware(
      req,
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // REPLACE BODY WITH PARSED DATA
  // ============================================================

  it('should replace req.body with the parsed Zod data', () => {
    const schema = z.object({
      name: z.string().trim(),
    });

    const req = createRequest({
      name: '  John  ',
    });

    const middleware =
      validateRequest(schema);

    middleware(
      req,
      response,
      next,
    );

    expect(req.body).toEqual({
      name: 'John',
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // INVALID BODY
  // ============================================================

  it('should reject an invalid request body', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const req = createRequest({
      email: 'invalid-email',
    });

    const middleware =
      validateRequest(schema);

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
  // MISSING REQUIRED FIELD
  // ============================================================

  it('should reject a request with a missing required field', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const req = createRequest({
      email: 'john@example.com',
    });

    const middleware =
      validateRequest(schema);

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
  // INVALID DATA TYPE
  // ============================================================

  it('should reject a field with the wrong data type', () => {
    const schema = z.object({
      age: z.number().int(),
    });

    const req = createRequest({
      age: '25',
    });

    const middleware =
      validateRequest(schema);

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
  // EMPTY BODY
  // ============================================================

  it('should reject an empty request body when fields are required', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const req = createRequest({});

    const middleware =
      validateRequest(schema);

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
  // NULL BODY
  // ============================================================

  it('should reject a null request body when an object is expected', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const req = createRequest(null);

    const middleware =
      validateRequest(schema);

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
  // ERROR STATUS
  // ============================================================

  it('should throw a 400 validation AppError', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const req = createRequest({
      email: 'bad-email',
    });

    const middleware =
      validateRequest(schema);

    try {
      middleware(
        req,
        response,
        next,
      );

      throw new Error(
        'Expected middleware to throw',
      );
    } catch (error) {
      expect(error).toBeInstanceOf(
        AppError,
      );

      const appError =
        error as AppError;

      expect(
        appError.statusCode,
      ).toBe(400);

      expect(appError.code).toBe(
        'VALIDATION_ERROR',
      );

      expect(appError.message).toBe(
        'Request validation failed.',
      );
    }

    expect(next).not.toHaveBeenCalled();
  });

  // ============================================================
  // VALID OPTIONAL FIELD
  // ============================================================

  it('should allow optional fields when they are omitted', () => {
    const schema = z.object({
      email: z.string().email(),
      phone: z.string().optional(),
    });

    const req = createRequest({
      email: 'john@example.com',
    });

    const middleware =
      validateRequest(schema);

    middleware(
      req,
      response,
      next,
    );

    expect(req.body).toEqual({
      email: 'john@example.com',
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // DEFAULT VALUES
  // ============================================================

  it('should assign Zod default values to req.body', () => {
    const schema = z.object({
      role: z
        .string()
        .default('CUSTOMER'),
    });

    const req = createRequest({});

    const middleware =
      validateRequest(schema);

    middleware(
      req,
      response,
      next,
    );

    expect(req.body).toEqual({
      role: 'CUSTOMER',
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // TRANSFORMED VALUES
  // ============================================================

  it('should store transformed values in req.body', () => {
    const schema = z.object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email(),
    });

    const req = createRequest({
      email: '  JOHN@EXAMPLE.COM  ',
    });

    const middleware =
      validateRequest(schema);

    middleware(
      req,
      response,
      next,
    );

    expect(req.body).toEqual({
      email: 'john@example.com',
    });

    expect(next).toHaveBeenCalledTimes(1);
  });
});