import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// ==========================================
// CUSTOM ERROR CLASSES
// ==========================================

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  errors: any[];

  constructor(message: string, errors: any[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

// ==========================================
// ERROR RESPONSE INTERFACE
// ==========================================

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    errors?: any[];
    stack?: string;
  };
}

// ==========================================
// ERROR HANDLER MIDDLEWARE
// ==========================================

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req.user as any)?.id,
  });

  // Default error response
  let statusCode = 500;
  let response: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  };

  // Handle AppError (custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error.message = err.message;
    response.error.code = err.code;
    if (err instanceof ValidationError) {
      response.error.errors = err.errors;
    }
  }

  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    response.error.message = 'Validation failed';
    response.error.code = 'VALIDATION_ERROR';
    response.error.errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }

  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        response.error.message = 'A record with this value already exists';
        response.error.code = 'DUPLICATE_ENTRY';
        break;
      case 'P2025':
        statusCode = 404;
        response.error.message = 'Record not found';
        response.error.code = 'NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        response.error.message = 'Foreign key constraint failed';
        response.error.code = 'FK_CONSTRAINT';
        break;
      case 'P2014':
        statusCode = 400;
        response.error.message = 'Invalid relation';
        response.error.code = 'INVALID_RELATION';
        break;
      default:
        response.error.message = 'Database error';
        response.error.code = err.code;
    }
  }

  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    response.error.message = 'Invalid data provided';
    response.error.code = 'PRISMA_VALIDATION';
  }

  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    response.error.message = 'Invalid token';
    response.error.code = 'INVALID_TOKEN';
  }

  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.error.message = 'Token expired';
    response.error.code = 'TOKEN_EXPIRED';
  }

  // Handle syntax errors (malformed JSON)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    response.error.message = 'Invalid JSON';
    response.error.code = 'INVALID_JSON';
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// ==========================================
// NOT FOUND HANDLER
// ==========================================

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
};

// ==========================================
// ASYNC HANDLER WRAPPER
// ==========================================

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
