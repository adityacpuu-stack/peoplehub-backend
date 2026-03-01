# PeopleHub Backend - Developer Guide

## Quick Start

```bash
npm run dev          # Start dev server (nodemon)
npm run build        # prisma generate && tsc
npm run start        # node dist/server.js
npm run db:migrate   # prisma migrate dev
npm run db:push      # prisma db push (no migration file)
npm run db:studio    # Prisma Studio GUI
npm run test         # jest
```

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Server entry point
├── config/
│   ├── env.ts             # Environment variables
│   ├── prisma.ts          # Prisma client
│   ├── redis.ts           # Redis client
│   └── swagger.ts         # Swagger config
├── middlewares/
│   ├── auth.middleware.ts       # JWT auth (req.user)
│   ├── error.middleware.ts      # Error classes + asyncHandler
│   ├── validate.middleware.ts   # Zod validation (validateBody/Query/Params)
│   ├── permission.middleware.ts # RBAC permission check
│   ├── role.middleware.ts       # Role-based access
│   ├── company.middleware.ts    # Company-scoped filtering
│   └── rate-limit.middleware.ts # Rate limiting
├── modules/               # Feature modules (controller + service + routes)
├── validations/            # Zod schemas per module
├── routes/                 # Route aggregation
├── types/                  # TypeScript type definitions
├── utils/                  # Shared utilities
├── jobs/                   # Background jobs
└── shared/                 # Shared constants/helpers
```

## Code Conventions

### Controllers
- Always wrap with `asyncHandler()` — no manual try-catch
- Never check `if (!req.user)` — use `req.user!` (auth middleware guarantees it)
- Return consistent response format: `{ success: true, data, message, meta }`

```typescript
// GOOD
export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await employeeService.getById(Number(req.params.id), userId);
  res.json({ success: true, data: result });
});

// BAD — don't do this
export const getEmployee = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    // ...
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Services
- Throw typed errors — the global error handler catches them
- Available error classes from `src/middlewares/error.middleware.ts`:

| Class | Status | Code |
|-------|--------|------|
| `NotFoundError(resource)` | 404 | NOT_FOUND |
| `ValidationError(msg, errors?)` | 400 | VALIDATION_ERROR |
| `BadRequestError(msg)` | 400 | BAD_REQUEST |
| `UnauthorizedError(msg?)` | 401 | UNAUTHORIZED |
| `ForbiddenError(msg?)` | 403 | FORBIDDEN |
| `ConflictError(msg?)` | 409 | CONFLICT |

```typescript
// GOOD
if (!employee) throw new NotFoundError('Employee');
if (!canAccess) throw new ForbiddenError('You cannot access this employee');

// BAD
if (!employee) return { error: 'Not found' }; // Don't return errors
throw new Error('Not found'); // Don't use generic Error
```

### Routes
- Use `validateBody(schema)`, `validateQuery(schema)`, `validateParams(schema)` from validate.middleware
- Schema files in `src/validations/<module>.schema.ts`

```typescript
router.post('/', authenticate, validateBody(createEmployeeSchema), controller.create);
router.get('/', authenticate, validateQuery(listQuerySchema), controller.list);
```

### Validation Schemas (Zod)
- Reuse common schemas from `src/validations/common.schema.ts`
- Available: `paginationSchema`, `searchSchema`, `listQuerySchema`, `idParamSchema`
- Field validators: `emailSchema`, `passwordSchema`, `phoneSchema`, `nikSchema`, `dateStringSchema`
- Enums: `genderSchema`, `employmentStatusSchema`, `approvalStatusSchema`

## Modules (44 total)

Each module follows the pattern: `src/modules/<name>/`
- `<name>.controller.ts` — route handlers
- `<name>.service.ts` — business logic
- `<name>.routes.ts` — Express router

### Core Modules
| Module | Description |
|--------|-------------|
| `auth` | Login, register, forgot password, token refresh |
| `user` | User management, send credentials, M365 integration |
| `employee` | Employee CRUD, profile, onboarding |
| `rbac` | Roles & permissions |
| `company` | Company management |
| `department` | Department hierarchy |
| `position` | Job positions |

### HR Modules
| Module | Description |
|--------|-------------|
| `attendance` | Clock in/out, attendance records |
| `attendance-setting` | Attendance rules & schedules |
| `leave` / `leaves` | Leave requests & approval |
| `leave-type` | Leave type configuration |
| `overtime` | Overtime requests & approval |
| `contract` | Employment contracts |
| `employee-movement` | Transfers, promotions |
| `company-assignment` | Multi-company assignments |

### Payroll Modules
| Module | Description |
|--------|-------------|
| `payroll` | Payroll calculation & export |
| `payroll-setting` | Payroll configuration |
| `payroll-adjustment` | Manual adjustments |
| `salary-component` | Salary structure |
| `salary-grade` | Salary grades/bands |
| `allowance` | Allowance types (THR, bonus, etc.) |
| `benefit` | Employee benefits |

### Performance Modules
| Module | Description |
|--------|-------------|
| `performance` | Performance reviews |
| `performance-cycle` | Review cycles |
| `goal` | Goal setting & tracking |
| `kpi` | KPI management |

### Other Modules
| Module | Description |
|--------|-------------|
| `microsoft365` | M365 Graph API integration (users, licenses, DLs) |
| `email` | Email service (Resend) |
| `notification` | In-app notifications |
| `announcement` | Company announcements |
| `document` | Document management |
| `document-category` | Document categories |
| `template` | Document templates |
| `form-template` | Form templates |
| `upload` | S3/DigitalOcean Spaces uploads |
| `holiday` | Public holidays |
| `work-location` | Office/remote locations |
| `setting` | System settings |
| `org-chart` | Organization chart |
| `dashboard` | Dashboard stats |
| `audit-log` | Audit trail |

## Key Integrations

### Microsoft 365 (Graph API)
- Service: `src/modules/microsoft365/microsoft365.service.ts`
- Creates M365 accounts, assigns licenses, manages distribution lists
- Auto-adds new users to company DL via `distribution_list_group_id` on Company model
- Pattern-based DL: `*.impact@pfigroups.com` → Impact DL

### Email (Resend)
- Service: `src/modules/email/`
- All emails sent via Resend API
- Templates for: credentials, password reset, notifications

### Storage (S3/Spaces)
- Service: `src/modules/upload/`
- DigitalOcean Spaces for file uploads

## Database

- **ORM**: Prisma (PostgreSQL)
- **Schema**: `prisma/schema.prisma`
- **Host**: Railway (production)
- Company model has `email_domain` and `distribution_list_group_id` for M365 integration

## Security Notes

- `RAILWAY_ENV.md` and `VERCEL_ENV.md` contain real credentials — NEVER reference or output their contents
- Never commit `.env` files
- Use environment variables from `config/env.ts`

## Git Conventions

```
feat: Short description     # New feature
fix: Short description      # Bug fix
refactor: Short description # Code restructure
docs: Short description     # Documentation
test: Short description     # Tests
chore: Short description    # Maintenance
```
