# CLAUDE.md - PeopleHub Backend

## Project Overview
PeopleHub is an HRIS (Human Resource Information System) backend for PFI Group. Multi-company, multi-role HR platform covering employee management, attendance, leave, payroll, performance, and more.

**Stack:** Express 5 + TypeScript + Prisma 5 + PostgreSQL + Redis + Zod 4
**Deploy:** Railway (backend) + Vercel (frontend) + Supabase (DB) + Redis Cloud

## Quick Start
```bash
npm run dev              # Dev server (nodemon + ts-node)
npm run build            # prisma generate && tsc
npx tsc --noEmit         # Type-check only (fast verification)
npm test                 # Jest (unit + integration)
npm run test:unit        # Unit tests only
npm run test:coverage    # With coverage report
npm run db:migrate       # Prisma migrate dev
npm run db:push          # Quick schema sync (no migration file)
npm run db:studio        # Prisma Studio GUI
npm run db:seed          # Seed database
```

## Environment Variables
```bash
# Required
DATABASE_URL=            # PostgreSQL connection string
JWT_SECRET=              # JWT signing secret
JWT_REFRESH_SECRET=      # Refresh token secret
PORT=3001                # Server port (Railway uses 8080)
NODE_ENV=                # development | production

# Optional but used
REDIS_HOST=              # Redis host (caching + rate limiting)
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=
REDIS_PREFIX=hr:
RESEND_API_KEY=          # Email service (Resend)
S3_ENDPOINT=             # DigitalOcean Spaces / S3
S3_REGION=
S3_BUCKET=
S3_CDN_URL=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
FRONTEND_URL=            # CORS origin + email links
APP_NAME=PeopleHub
```
Config loaded at `src/config/env.ts`. Redis is optional — server starts without it.

## Project Structure
```
src/
  app.ts                  # Express app: middleware chain -> routes -> errorHandler
  server.ts               # Server startup, Redis init, graceful shutdown
  config/                 # env.ts, prisma.ts, redis.ts, swagger.ts
  middlewares/             # auth, role, company, error, validate, rate-limit
  modules/                # Feature modules (routes, controller, service, types)
  types/auth.types.ts     # AuthUser interface, role hierarchy, ROLES constant
  validations/            # Zod schemas (common.schema.ts, employee.schema.ts)
  utils/                  # logger (Pino), cache, helpers
  __tests__/              # unit/ and integration/ dirs
prisma/
  schema.prisma           # All models
  migrations/             # Migration history
  seed.ts                 # Seeder
```

## Module Pattern
Every module in `src/modules/<name>/`:
```
<name>.routes.ts       # Router + middleware chain
<name>.controller.ts   # Request handlers (THIN - delegates to service)
<name>.service.ts      # Business logic, Prisma queries
<name>.types.ts        # DTOs, Prisma select objects, query interfaces
```

---

## Architecture Conventions

### Controller Pattern
Reference: `src/modules/employee/employee.controller.ts`

```typescript
import { asyncHandler, BadRequestError, NotFoundError } from '../../middlewares/error.middleware';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.list(req.query as any, req.user!);
  res.json({ message: 'Items retrieved successfully', ...result });
});
```

- Wrap with `asyncHandler()` — no try-catch
- Use `req.user!` — authenticate middleware guarantees it
- Throw error classes — don't return error responses manually
- Keep thin — parse request, call service, send response

### Service Pattern
Services throw typed errors. The `errorHandler` middleware maps them to HTTP status codes.

```typescript
import { NotFoundError, ForbiddenError, ConflictError } from '../../middlewares/error.middleware';

throw new NotFoundError('Employee');          // 404 NOT_FOUND
throw new ForbiddenError('Access denied');    // 403 FORBIDDEN
throw new ConflictError('Already exists');    // 409 CONFLICT
throw new BadRequestError('Invalid input');   // 400 BAD_REQUEST
throw new ValidationError('Failed', errors);  // 400 VALIDATION_ERROR
throw new UnauthorizedError();                // 401 UNAUTHORIZED
```

### Route Pattern
Middleware chain: `authenticate` -> role gate -> company access -> Zod validation -> controller

```typescript
import { validateBody, validateQuery } from '../../middlewares/validate.middleware';
import { createSchema, listQuerySchema } from '../../validations/<name>.schema';

router.use(authenticate);
router.get('/', requireManagerOrHigher, validateQuery(listQuerySchema), controller.list);
router.post('/', requireHRStaffOrHigher, validateBody(createSchema), controller.create);
router.put('/:id', requireHRStaffOrHigher, validateBody(updateSchema), controller.update);
```

### Error Response Format
All errors go through `errorHandler` and produce:
```json
{ "success": false, "error": { "message": "...", "code": "NOT_FOUND" } }
```

---

## Do NOT (Anti-patterns)
- **Jangan** pakai `try-catch` di controller — pakai `asyncHandler`
- **Jangan** return error response manual di controller (`res.status(4xx).json(...)`) — throw error class
- **Jangan** check `if (!req.user)` di controller — `authenticate` middleware sudah jamin
- **Jangan** `throw new Error('...')` di service — pakai `NotFoundError`, `ForbiddenError`, dll
- **Jangan** map error status dari string (`error.message.includes('not found') ? 404 : 500`) — pakai typed error classes
- **Jangan** akses `prisma` langsung di controller — lewat service
- **Jangan** hardcode company ID atau employee ID
- **Jangan** skip Zod validation di route baru — semua POST/PUT harus `validateBody(schema)`
- **Jangan** bikin file baru kalau bisa edit yang ada
- **Jangan** commit file `.env`, credentials, atau secrets

---

## Available Middleware
| Middleware | File | Purpose |
|---|---|---|
| `authenticate` | auth.middleware.ts | JWT auth, populates `req.user: AuthUser` |
| `requireHRStaffOrHigher` | role.middleware.ts | Role level >= 60 (HR Staff) |
| `requireManagerOrHigher` | role.middleware.ts | Role level >= 50 (Manager) |
| `requireHRManagerOrHigher` | role.middleware.ts | Role level >= 70 |
| `requireCEOOrHigher` | role.middleware.ts | Role level >= 80 |
| `requireSuperAdmin` | role.middleware.ts | Super Admin only |
| `requireRole(...roles)` | role.middleware.ts | Specific roles |
| `requireSelfEmployeeOrRole(...)` | role.middleware.ts | Own resource or elevated role |
| `requireHRStaffOrTaxAccess` | role.middleware.ts | HR Staff+ or Tax roles |
| `validateCompanyAccess` | company.middleware.ts | Company access from `req.params` |
| `validateCompanyAccessFromQuery` | company.middleware.ts | Company access from `req.query` |
| `validateBody(schema)` | validate.middleware.ts | Zod body validation |
| `validateQuery(schema)` | validate.middleware.ts | Zod query validation |
| `validateParams(schema)` | validate.middleware.ts | Zod params validation |
| `asyncHandler(fn)` | error.middleware.ts | Catch async errors -> errorHandler |
| `generalLimiter` | rate-limit.middleware.ts | General rate limiting |
| `authLimiter` | rate-limit.middleware.ts | Auth route rate limiting |

## Role Hierarchy
```
Super Admin: 100    Group CEO: 90    CEO: 80
HR Manager: 70      Finance Manager: 65    Tax Manager: 64
HR Staff: 60        Tax Staff: 58    Manager: 50    Employee: 10
```
Super Admin always bypasses all role & company checks. Tax roles bypass company checks for tax reporting.

## Auth Context (`req.user: AuthUser`)
Defined in `src/types/auth.types.ts`. Populated by `authenticate` middleware.
```typescript
{
  id: number;                      // User table ID
  email: string;
  is_active: boolean;
  force_password_change: boolean;
  employee: {                      // null if no employee record
    id, employee_id, name,
    company_id, department_id, position_id,
    employment_status, profile_completed
  } | null;
  roles: string[];                 // e.g. ['HR Staff', 'Manager']
  permissions: string[];
  accessibleCompanyIds: number[];  // Companies user can access
}
```

---

## Database & Prisma Patterns

### General
- Schema: `prisma/schema.prisma`
- Client: `import { prisma } from '../../config/prisma'`
- All models use `@@map("snake_case_table_name")`
- IDs: auto-increment `Int @id @default(autoincrement())`
- Timestamps: `created_at DateTime @default(now())` + `updated_at DateTime @updatedAt`

### Soft Delete
Some models use `deleted_at DateTime?` (Allowance, Overtime, Leave, etc.). Employee uses `employment_status = 'terminated'` instead. When querying, always filter: `where: { deleted_at: null }` or `employment_status: 'active'`.

### Select vs Include
Prefer `select` over `include` — define select objects in `<module>.types.ts`:
```typescript
export const EMPLOYEE_LIST_SELECT = {
  id: true,
  employee_id: true,
  name: true,
  company: { select: { id: true, name: true } },
  // ...
} satisfies Prisma.EmployeeSelect;
```

### Pagination Pattern
```typescript
const skip = (page - 1) * limit;
const [data, total] = await Promise.all([
  prisma.model.findMany({ where, select, skip, take: limit, orderBy }),
  prisma.model.count({ where }),
]);
return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
```

### Zod Schemas for Queries
Use `z.coerce.number()` for query params (they come as strings):
```typescript
export const listQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
});
```

### Common Reusable Schemas
All in `src/validations/common.schema.ts`:
- `paginationSchema` — page + limit with defaults
- `searchSchema` — optional search string
- `emailSchema`, `phoneSchema`, `nikSchema`, `npwpSchema`
- `dateStringSchema` — YYYY-MM-DD format
- `genderSchema`, `employmentStatusSchema`, `maritalStatusSchema`

---

## Multi-Company Architecture
- Every employee belongs to a company. Access scoped by `user.accessibleCompanyIds`.
- HR Staff can be assigned to multiple companies via `HrStaffCompanyAssignment`.
- Company hierarchy: Holding (parent) -> Subsidiaries (`parent_company_id`).
- Services MUST check company access: `user.accessibleCompanyIds.includes(companyId)`.
- Super Admin bypasses all company checks.
- Hidden system accounts: `['EMP-001', 'PFI-PDR-HRSTAFF']` excluded from listings.
- Employee ID format: `{HOLDING}-{COMPANY}-{YY}{NNNNN}` e.g. `PFI-GDI-2500001`.

---

## Testing Conventions

### Structure
```
src/__tests__/
  setup.ts                         # Global setup, Prisma mock, console mock
  unit/
    error.middleware.test.ts        # Unit test for error classes
    validations.test.ts            # Unit test for Zod schemas
  integration/
    auth.test.ts                   # Integration test with supertest
```

### Rules
- Test files: `**/__tests__/**/*.test.ts` or `**/*.spec.ts`
- Mock Prisma in `setup.ts` — don't hit real database in unit tests
- Integration tests use supertest with a minimal Express app
- Coverage threshold: 50% (branches, functions, lines, statements)
- Run: `npm test` (all), `npm run test:unit`, `npm run test:coverage`

### What to Test
- **Unit:** Zod schemas (valid/invalid input), error classes, utility functions
- **Integration:** API endpoints (status codes, response format, auth checks)
- **Naming:** `describe('ModuleName')` -> `describe('methodName')` -> `it('should ...')`

---

## Git Conventions

### Commit Messages
Format: `type: Short description`

Types:
- `feat:` — New feature or enhancement
- `fix:` — Bug fix
- `refactor:` — Code restructuring, no behavior change
- `docs:` — Documentation only
- `test:` — Adding/updating tests
- `chore:` — Dependencies, config, tooling

Examples from this repo:
```
feat: Add family card number and personal email to employee export
fix: Use correct Prisma relation name workLocationRef in employee export
refactor: Remove salary and education columns from employee export
```

### Branch
Single `main` branch (no feature branches currently). All work is on main.

---

## Deployment

### Railway (Production Backend)
- Build: `npm run build` (runs `prisma generate && tsc`)
- Start: `npm start` (runs `node dist/server.js`)
- Port: Railway sets `PORT` automatically
- After deploy: `npx prisma migrate deploy`
- DB: Supabase PostgreSQL (via connection pooler, pgbouncer)
- Redis: Redis Cloud

### Key Differences: Dev vs Prod
| | Development | Production |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `3001` | Set by Railway |
| Error stack traces | Included in response | Hidden |
| Request logging | Enabled | Enabled |
| Rate limiting | Lenient | Strict |
| CORS | localhost:5173, localhost:3000 | peoplehub-frontend.vercel.app |

---

## Refactoring Status
| Module | asyncHandler | Typed Errors | Zod Validation | Status |
|---|---|---|---|---|
| `employee` | Done | Done | Done | **Refactored** |
| All others | Not yet | Not yet | Not yet | Old pattern |

When touching any module, refactor it to follow the employee pattern.

---

## Important Files Reference
| File | Purpose |
|---|---|
| `src/middlewares/error.middleware.ts` | Error classes, asyncHandler, errorHandler |
| `src/middlewares/validate.middleware.ts` | validateBody/Query/Params |
| `src/middlewares/auth.middleware.ts` | JWT auth, AuthUser builder |
| `src/middlewares/role.middleware.ts` | Role gates (requireHRStaffOrHigher, etc.) |
| `src/types/auth.types.ts` | AuthUser, ROLE_HIERARCHY, ROLES constant |
| `src/validations/common.schema.ts` | Reusable Zod schemas |
| `src/app.ts` | Middleware chain + all route registration |
| `prisma/schema.prisma` | All database models |

## Communication
- Respond in the same language the user uses (Indonesian or English)
- Keep responses concise and practical
- Always read this file + `.ai-context.md` before starting work
