import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidateOptions {
  stripUnknown?: boolean;
}

/**
 * Validate request data against a Zod schema
 */
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body',
  options: ValidateOptions = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const validated = await schema.parseAsync(data);

      // Replace request data with validated data
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors,
          },
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Validate multiple targets at once
 */
export const validateMultiple = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: any[] = [];

      for (const [target, schema] of Object.entries(schemas)) {
        if (schema) {
          try {
            const data = req[target as ValidationTarget];
            const validated = await schema.parseAsync(data);
            req[target as ValidationTarget] = validated;
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(
                ...error.issues.map((issue) => ({
                  target,
                  field: issue.path.join('.'),
                  message: issue.message,
                  code: issue.code,
                }))
              );
            } else {
              throw error;
            }
          }
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors,
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Shorthand validators
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
