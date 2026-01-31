import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// ==========================================
// LOGGER CONFIGURATION
// ==========================================

export const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// ==========================================
// CHILD LOGGERS FOR MODULES
// ==========================================

export const createModuleLogger = (moduleName: string) => {
  return logger.child({ module: moduleName });
};

// Pre-created module loggers
export const authLogger = createModuleLogger('auth');
export const employeeLogger = createModuleLogger('employee');
export const attendanceLogger = createModuleLogger('attendance');
export const payrollLogger = createModuleLogger('payroll');
export const performanceLogger = createModuleLogger('performance');

// ==========================================
// REQUEST LOGGER MIDDLEWARE
// ==========================================

import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req.user as any)?.id,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request error');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
};

// ==========================================
// AUDIT LOGGER
// ==========================================

interface AuditLogData {
  userId?: number;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: number;
  details?: Record<string, any>;
  ip?: string;
}

export const auditLog = (data: AuditLogData) => {
  logger.info(
    {
      type: 'AUDIT',
      ...data,
      timestamp: new Date().toISOString(),
    },
    `[AUDIT] ${data.action} on ${data.resource}`
  );
};

export default logger;
