# Architecture - PeopleHub Backend

## System Overview

```
[Frontend - React/Vite]
        |
        | HTTPS (JWT Bearer)
        v
[Express 5 API Server]
   |    |    |    |
   |    |    |    +---> [Redis Cloud] (cache, rate limiting)
   |    |    +--------> [DigitalOcean Spaces] (file storage)
   |    +-------------> [Resend] (email)
   +-------------------> [Supabase PostgreSQL] (database)
```

## Request Lifecycle

```
Request
  -> helmet, cors, json parser
  -> rate limiter
  -> authenticate (JWT -> AuthUser)
  -> role middleware (requireHRStaffOrHigher, etc.)
  -> company access middleware
  -> Zod validation middleware
  -> controller (thin: parse -> delegate -> respond)
  -> service (business logic, Prisma queries)
  -> response

If error at any point:
  -> asyncHandler catches
  -> errorHandler middleware
  -> consistent JSON error response
```

## Module Architecture

Each feature is a self-contained module under `src/modules/`:

```
src/modules/employee/
  employee.routes.ts       # Express Router, middleware chain
  employee.controller.ts   # Request handlers (asyncHandler wrapped)
  employee.service.ts      # Business logic (throws typed errors)
  employee.types.ts        # DTOs, Prisma select objects
  employee-export.service.ts  # Sub-services for specific features
```

### Layer Responsibilities

| Layer | Does | Does NOT |
|---|---|---|
| **Route** | Define paths, chain middleware, bind controller | Contain logic |
| **Controller** | Parse request, call service, format response | Access Prisma, handle errors |
| **Service** | Business logic, Prisma queries, throw typed errors | Access req/res |
| **Types** | Define DTOs, select objects, query interfaces | Contain logic |

## Multi-Company Model

```
Company (Holding)
  ├── Company (Subsidiary 1)
  │     └── Employees
  ├── Company (Subsidiary 2)
  │     └── Employees
  └── Company (Subsidiary 3)
        └── Employees
```

Access rules:
- **Super Admin:** All companies
- **Group CEO / CEO / HR Manager:** All companies in their group
- **HR Staff:** Explicitly assigned companies (HrStaffCompanyAssignment)
- **Manager / Employee:** Own company only
- **Tax roles:** All companies (for tax reporting)

## Auth Flow

1. `POST /api/v1/auth/login` — email + password -> JWT token
2. Client sends `Authorization: Bearer <token>` on every request
3. `authenticate` middleware verifies JWT, loads user with roles/permissions/companies
4. `req.user` (AuthUser) available to all downstream middleware and controllers

## Error Handling Chain

```
Service throws NotFoundError('Employee')
  -> asyncHandler catches it
  -> next(error) called
  -> errorHandler middleware
  -> checks: is AppError? ZodError? PrismaError? JWT error?
  -> responds with { success: false, error: { message, code } }
```

## Database

- PostgreSQL via Prisma ORM
- Models use snake_case table names (@@map)
- Auto-increment integer IDs
- Soft delete via `deleted_at` timestamp or `employment_status` field
- Relations use Prisma relation fields (not raw SQL)
- Select objects preferred over include (explicit field control)
