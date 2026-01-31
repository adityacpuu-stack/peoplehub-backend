import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssueCode } from 'zod';
import {
  errorHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '../../middlewares/error.middleware';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.name = 'PrismaClientKnownRequestError';
        this.code = code;
      }
    },
    PrismaClientValidationError: class PrismaClientValidationError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'PrismaClientValidationError';
      }
    },
  },
}));

describe('Error Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      user: { id: 1 } as any,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError('User');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create ValidationError with errors array', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', errors);
      expect(error.statusCode).toBe(400);
      expect(error.errors).toEqual(errors);
    });

    it('should create UnauthorizedError with 401 status', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
    });

    it('should create ForbiddenError with 403 status', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
    });

    it('should create BadRequestError with 400 status', () => {
      const error = new BadRequestError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
        },
      });
    });

    it('should handle ValidationError with errors array', () => {
      const errors = [{ field: 'email', message: 'Invalid' }];
      const error = new ValidationError('Validation failed', errors);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            errors,
          }),
        })
      );
    });

    it('should handle ZodError correctly', () => {
      const zodError = new ZodError([
        {
          code: ZodIssueCode.custom,
          path: ['email'],
          message: 'Invalid email format',
        },
      ]);

      errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            errors: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
              }),
            ]),
          }),
        })
      );
    });

    it('should handle JWT errors', () => {
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      errorHandler(jwtError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TOKEN',
          }),
        })
      );
    });

    it('should handle TokenExpiredError', () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';

      errorHandler(expiredError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'TOKEN_EXPIRED',
          }),
        })
      );
    });

    it('should handle unknown errors with 500', () => {
      const unknownError = new Error('Something went wrong');

      errorHandler(unknownError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          }),
        })
      );
    });
  });
});
