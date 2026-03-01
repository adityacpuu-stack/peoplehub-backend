# Refactoring Progress

## Pattern Reference

The `employee` module is the **reference implementation** for the new pattern:
- Controller: `asyncHandler()`, no try-catch, `req.user!`
- Service: throws typed errors (`NotFoundError`, `ForbiddenError`, etc.)
- Routes: `validateBody(schema)` / `validateQuery(schema)`
- Schema: `src/validations/employee.schema.ts`

## Module Status

### Done (New Pattern)
| Module | Status | Notes |
|--------|--------|-------|
| `employee` | DONE | Reference implementation |
| `auth` | DONE | asyncHandler, typed errors, validateBody on all routes |
| `user` | PARTIAL | Service refactored, some old patterns remain |

### Not Yet Refactored (Old Pattern)
These modules still use manual try-catch, string errors, and inline validation:

| Module | Priority | Notes |
|--------|----------|-------|
| ~~`auth`~~ | ~~High~~ | DONE — moved to Done table |
| `rbac` | High | Permission system |
| `attendance` | Medium | High usage |
| `leave` / `leaves` | Medium | High usage |
| `overtime` | Medium | |
| `payroll` | Medium | Complex logic |
| `contract` | Medium | |
| `company` | Low | Admin only |
| `department` | Low | Admin only |
| `position` | Low | Admin only |
| `salary-component` | Low | |
| `salary-grade` | Low | |
| `allowance` | Low | |
| `benefit` | Low | |
| `payroll-adjustment` | Low | |
| `payroll-setting` | Low | |
| `performance` | Low | |
| `performance-cycle` | Low | |
| `goal` | Low | |
| `kpi` | Low | |
| `notification` | Low | |
| `announcement` | Low | |
| `document` | Low | |
| `document-category` | Low | |
| `template` | Low | |
| `form-template` | Low | |
| `holiday` | Low | |
| `work-location` | Low | |
| `setting` | Low | |
| `org-chart` | Low | |
| `dashboard` | Low | |
| `audit-log` | Low | |
| `employee-movement` | Low | |
| `company-assignment` | Low | |
| `attendance-setting` | Low | |
| `leave-type` | Low | |

### Validation Schemas Created
Zod schemas exist in `src/validations/` but most are not yet wired into routes:

- `employee.schema.ts` — WIRED (reference)
- `attendance.schema.ts` — created, not wired
- `overtime.schema.ts` — created, not wired
- `leave.schema.ts` — created, not wired
- `payroll.schema.ts` — created, not wired
- `document.schema.ts` — created, not wired
- `rbac.schema.ts` — created, not wired
- `contract.schema.ts` — created, not wired
- `auth.schema.ts` — WIRED (login, refresh, change-password, forgot-password, reset-password)
- `user.schema.ts` — created, not wired
- (+ 25 more in `src/validations/`)
