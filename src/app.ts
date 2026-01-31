import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { swaggerSpec } from './config/swagger';
import { requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { generalLimiter, authLimiter } from './middlewares/rate-limit.middleware';
import { checkRedisHealth } from './config/redis';
import { getCacheStats } from './utils/cache';

const app = express();

// Trust proxy - required for Vercel/cloud deployments
// This allows express-rate-limit to correctly identify users via X-Forwarded-For header
app.set('trust proxy', 1);

// ==========================================
// CORE MIDDLEWARE
// ==========================================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// General rate limiting
app.use(generalLimiter);

// ==========================================
// API DOCUMENTATION
// ==========================================
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'HRIS API Documentation',
}));

// Swagger spec JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ==========================================
// ROUTES
// ==========================================
import authRoutes from './modules/auth/auth.routes';
import employeeRoutes from './modules/employee/employee.routes';
import departmentRoutes from './modules/department/department.routes';
import positionRoutes from './modules/position/position.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import overtimeRoutes from './modules/overtime/overtime.routes';
import leaveRoutes from './modules/leave/leave.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import performanceRoutes from './modules/performance/performance.routes';
import contractRoutes from './modules/contract/contract.routes';
import documentRoutes from './modules/document/document.routes';
import companyRoutes from './modules/company/company.routes';
import holidayRoutes from './modules/holiday/holiday.routes';
import settingRoutes from './modules/setting/setting.routes';
import rbacRoutes from './modules/rbac/rbac.routes';
import workLocationRoutes from './modules/work-location/work-location.routes';
import attendanceSettingRoutes from './modules/attendance-setting/attendance-setting.routes';
import leaveTypeRoutes from './modules/leave-type/leave-type.routes';
import payrollSettingRoutes from './modules/payroll-setting/payroll-setting.routes';
import allowanceRoutes from './modules/allowance/allowance.routes';
import salaryComponentRoutes from './modules/salary-component/salary-component.routes';
import salaryGradeRoutes from './modules/salary-grade/salary-grade.routes';
import benefitRoutes from './modules/benefit/benefit.routes';
import payrollAdjustmentRoutes from './modules/payroll-adjustment/payroll-adjustment.routes';
import employeeMovementRoutes from './modules/employee-movement/employee-movement.routes';
import performanceCycleRoutes from './modules/performance-cycle/performance-cycle.routes';
import goalRoutes from './modules/goal/goal.routes';
import kpiRoutes from './modules/kpi/kpi.routes';
import documentCategoryRoutes from './modules/document-category/document-category.routes';
import formTemplateRoutes from './modules/form-template/form-template.routes';
import templateRoutes from './modules/template/template.routes';
import announcementRoutes from './modules/announcement/announcement.routes';
import auditLogRoutes from './modules/audit-log/audit-log.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import companyAssignmentRoutes from './modules/company-assignment/company-assignment.routes';
import userRoutes from './modules/user/user.routes';
import orgChartRoutes from './modules/org-chart/org-chart.routes';
import notificationRoutes from './modules/notification/notification.routes';

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HRIS Backend is running!',
    version: '1.0.0',
    docs: '/api/docs',
  });
});

app.get('/health', async (req, res) => {
  const redisHealth = await checkRedisHealth();
  const cacheStats = await getCacheStats();

  const isHealthy = redisHealth.status === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      api: { status: 'healthy' },
      redis: {
        status: redisHealth.status,
        latency: redisHealth.latency,
        error: redisHealth.error,
        stats: cacheStats,
      },
    },
  });
});

// Auth routes with stricter rate limiting
app.use('/api/v1/auth', authLimiter, authRoutes);

// Core modules
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/positions', positionRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/company-assignments', companyAssignmentRoutes);
app.use('/api/v1/org-chart', orgChartRoutes);

// Attendance & Time
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/attendance-settings', attendanceSettingRoutes);
app.use('/api/v1/work-locations', workLocationRoutes);

// Leave Management
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/leave-types', leaveTypeRoutes);
app.use('/api/v1/holidays', holidayRoutes);

// Payroll & Compensation
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/payroll-settings', payrollSettingRoutes);
app.use('/api/v1/payroll-adjustments', payrollAdjustmentRoutes);
app.use('/api/v1/salary-components', salaryComponentRoutes);
app.use('/api/v1/salary-grades', salaryGradeRoutes);
app.use('/api/v1/allowances', allowanceRoutes);
app.use('/api/v1/benefits', benefitRoutes);
app.use('/api/v1/overtime', overtimeRoutes);

// Performance Management
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/performance-cycles', performanceCycleRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/kpis', kpiRoutes);

// HR Operations
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/document-categories', documentCategoryRoutes);
app.use('/api/v1/employee-movements', employeeMovementRoutes);
app.use('/api/v1/form-templates', formTemplateRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/announcements', announcementRoutes);

// System
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/rbac', rbacRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
