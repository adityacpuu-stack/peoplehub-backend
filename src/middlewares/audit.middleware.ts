import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

// Routes to exclude from audit logging
const EXCLUDED_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh-token',
  '/api/v1/audit-logs',
  '/health',
  '/api/docs',
];

// Map HTTP methods to audit actions
const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

// Map URL path segments to model names
const PATH_MODEL_MAP: Record<string, string> = {
  employees: 'Employee',
  departments: 'Department',
  positions: 'Position',
  companies: 'Company',
  'company-assignments': 'CompanyAssignment',
  users: 'User',
  attendance: 'Attendance',
  'attendance-settings': 'AttendanceSetting',
  leaves: 'Leave',
  'leave-types': 'LeaveType',
  overtime: 'Overtime',
  payroll: 'Payroll',
  'payroll-settings': 'PayrollSetting',
  'payroll-adjustments': 'PayrollAdjustment',
  'salary-components': 'SalaryComponent',
  'salary-grades': 'SalaryGrade',
  allowances: 'Allowance',
  benefits: 'Benefit',
  performance: 'Performance',
  'performance-cycles': 'PerformanceCycle',
  goals: 'Goal',
  kpis: 'KPI',
  contracts: 'Contract',
  documents: 'Document',
  'document-categories': 'DocumentCategory',
  'employee-movements': 'EmployeeMovement',
  'form-templates': 'FormTemplate',
  templates: 'Template',
  announcements: 'Announcement',
  holidays: 'Holiday',
  'work-locations': 'WorkLocation',
  settings: 'Setting',
  rbac: 'RBAC',
  notifications: 'Notification',
  'org-chart': 'OrgChart',
  dashboard: 'Dashboard',
  upload: 'Upload',
};

/**
 * Extract model name from URL path
 * e.g. /api/v1/employees/5 → "Employee"
 */
function extractModel(url: string): string | undefined {
  const segments = url.split('?')[0].split('/').filter(Boolean);
  // Find the resource segment after "v1"
  const v1Index = segments.indexOf('v1');
  if (v1Index === -1 || v1Index + 1 >= segments.length) return undefined;
  const resource = segments[v1Index + 1];
  return PATH_MODEL_MAP[resource];
}

/**
 * Extract model ID from URL path
 * e.g. /api/v1/employees/5 → 5
 */
function extractModelId(url: string): number | undefined {
  const segments = url.split('?')[0].split('/').filter(Boolean);
  const v1Index = segments.indexOf('v1');
  if (v1Index === -1 || v1Index + 2 >= segments.length) return undefined;
  const id = Number(segments[v1Index + 2]);
  return isNaN(id) ? undefined : id;
}

/**
 * Check if a path should be excluded from audit logging
 */
function isExcluded(url: string): boolean {
  const path = url.split('?')[0];
  return EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded));
}

/**
 * Audit Trail Middleware
 * Automatically logs all mutating API requests (POST/PUT/PATCH/DELETE)
 * Uses res.on('finish') so it runs after the response is sent (non-blocking)
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.on('finish', () => {
    // Only log mutating methods
    const method = req.method.toUpperCase();
    if (!METHOD_ACTION_MAP[method]) return;

    // Only log successful responses
    if (res.statusCode >= 400) return;

    // Skip excluded routes
    if (isExcluded(req.originalUrl)) return;

    // Skip if no authenticated user
    const user = req.user;
    if (!user) return;

    const action = METHOD_ACTION_MAP[method];
    const model = extractModel(req.originalUrl);
    const modelId = extractModelId(req.originalUrl);

    // Build description
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    const modelLabel = model || 'Resource';
    const description = modelId
      ? `${actionLabel}d ${modelLabel} #${modelId}`
      : `${actionLabel}d ${modelLabel}`;

    // Fire-and-forget DB write
    prisma.auditLog
      .create({
        data: {
          user_id: user.id,
          user_email: user.email,
          employee_name: user.employee?.name,
          action,
          model,
          model_id: modelId,
          description,
          ip_address: req.ip || req.headers['x-forwarded-for']?.toString(),
          user_agent: req.headers['user-agent'],
          url: req.originalUrl,
          method,
        },
      })
      .catch(() => {
        // Silent catch — audit logging should never break the app
      });
  });

  next();
};
