import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HRIS API Documentation',
      version: '1.0.0',
      description: `
        Human Resource Information System (HRIS) API

        ## Authentication
        All endpoints (except /auth/login and /auth/register) require a valid JWT token.
        Include the token in the Authorization header: \`Bearer <token>\`

        ## Rate Limiting
        - General endpoints: 1000 requests per 15 minutes
        - Auth endpoints: 10 requests per 15 minutes
        - Export endpoints: 20 requests per hour

        ## Response Format
        All responses follow a standard format:
        \`\`\`json
        {
          "success": true,
          "data": { ... }
        }
        \`\`\`

        Error responses:
        \`\`\`json
        {
          "success": false,
          "error": {
            "message": "Error description",
            "code": "ERROR_CODE",
            "errors": [] // For validation errors
          }
        }
        \`\`\`
      `,
      contact: {
        name: 'HRIS Support',
        email: 'support@hrisgroup.co.id',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
      {
        url: '/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login',
        },
      },
      schemas: {
        // Common schemas
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Error message' },
                code: { type: 'string', example: 'ERROR_CODE' },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },

        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                refresh_token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    email: { type: 'string' },
                    roles: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },

        // Employee schemas
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employee_id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            employment_status: { type: 'string', enum: ['active', 'inactive', 'terminated', 'resigned', 'retired'] },
            department: { type: 'object' },
            position: { type: 'object' },
          },
        },
        CreateEmployee: {
          type: 'object',
          required: ['employee_id', 'name', 'email', 'company_id', 'join_date'],
          properties: {
            employee_id: { type: 'string', example: 'EMP001' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            company_id: { type: 'integer' },
            department_id: { type: 'integer' },
            position_id: { type: 'integer' },
            join_date: { type: 'string', format: 'date' },
            employment_status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },

        // Dashboard schemas
        DashboardOverview: {
          type: 'object',
          properties: {
            employee: { $ref: '#/components/schemas/EmployeeSummary' },
            attendance: { $ref: '#/components/schemas/AttendanceSummary' },
            leave: { $ref: '#/components/schemas/LeaveSummary' },
            payroll: { $ref: '#/components/schemas/PayrollSummary' },
            performance: { $ref: '#/components/schemas/PerformanceSummary' },
            alerts: { type: 'array', items: { $ref: '#/components/schemas/DashboardAlert' } },
          },
        },
        EmployeeSummary: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            active: { type: 'integer' },
            inactive: { type: 'integer' },
            new_this_month: { type: 'integer' },
          },
        },
        AttendanceSummary: {
          type: 'object',
          properties: {
            today: {
              type: 'object',
              properties: {
                total_expected: { type: 'integer' },
                checked_in: { type: 'integer' },
                late: { type: 'integer' },
                absent: { type: 'integer' },
              },
            },
          },
        },
        LeaveSummary: {
          type: 'object',
          properties: {
            pending_requests: { type: 'integer' },
            on_leave_today: { type: 'integer' },
          },
        },
        PayrollSummary: {
          type: 'object',
          properties: {
            current_period: { type: 'object' },
            pending_adjustments: { type: 'integer' },
          },
        },
        PerformanceSummary: {
          type: 'object',
          properties: {
            active_cycles: { type: 'integer' },
            pending_reviews: { type: 'integer' },
          },
        },
        DashboardAlert: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['warning', 'info', 'error', 'success'] },
            title: { type: 'string' },
            message: { type: 'string' },
            count: { type: 'integer' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Dashboard', description: 'Dashboard and statistics' },
      { name: 'Employees', description: 'Employee management' },
      { name: 'Departments', description: 'Department management' },
      { name: 'Positions', description: 'Position management' },
      { name: 'Attendance', description: 'Attendance tracking' },
      { name: 'Leave', description: 'Leave management' },
      { name: 'Overtime', description: 'Overtime management' },
      { name: 'Payroll', description: 'Payroll processing' },
      { name: 'Performance', description: 'Performance management' },
      { name: 'Contracts', description: 'Contract management' },
      { name: 'Documents', description: 'Document management' },
      { name: 'Settings', description: 'System settings' },
      { name: 'RBAC', description: 'Roles and permissions' },
    ],
  },
  apis: ['./src/modules/**/**.routes.ts', './src/docs/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
