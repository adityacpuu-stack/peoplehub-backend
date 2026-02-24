# Refactoring Progress

Tracking the migration of modules from old pattern to new pattern (asyncHandler + typed errors + Zod validation).

## Pattern Reference
See `CLAUDE.md` -> "Architecture Conventions" for the target pattern.
Reference implementation: `src/modules/employee/`

## Status

### Done
| Module | asyncHandler | Typed Errors | Zod Routes | Notes |
|---|---|---|---|---|
| employee | Done | Done | Done | Reference implementation |
| auth | Done | Done | Done | Batch 1 - camelCase schema fields |
| company | Done | Done | Done | Batch 1 - class->function exports |
| department | Done | Done | Done | Batch 1 |
| position | Done | Done | Done | Batch 1 |
| contract | Done | Done | - | Batch 1 - service+controller only |
| document | Done | Done | - | Batch 1 - service+controller only |
| user | Done | Done | - | Batch 1 - class->function exports |
| rbac | Done | Done | - | Batch 1 - class->function exports |

### To Do (Priority Order)
| Module | Files | Complexity | Notes |
|---|---|---|---|
| leave | 4 | Medium | Approval workflow |
| attendance | 4 | Medium | Clock in/out logic |
| overtime | 3 | Medium | Approval workflow |
| payroll | 5 | High | Complex calculation, export |
| allowance | 3 | Low | Simple CRUD + soft delete |
| salary-component | 3 | Low | Reference data |
| salary-grade | 3 | Low | Reference data |
| benefit | 3 | Low | Simple CRUD |
| payroll-adjustment | 3 | Low | Simple CRUD |
| payroll-setting | 3 | Low | Config management |
| holiday | 3 | Low | Simple CRUD |
| leave-type | 3 | Low | Reference data |
| attendance-setting | 3 | Low | Config management |
| work-location | 3 | Low | Reference data |
| performance | 4 | Medium | Review workflow |
| performance-cycle | 3 | Low | Cycle management |
| goal | 3 | Low | CRUD |
| kpi | 3 | Low | CRUD |
| employee-movement | 3 | Low | Transfer/promotion records |
| form-template | 3 | Low | Template management |
| template | 3 | Low | Email/doc templates |
| announcement | 3 | Medium | Multi-company targeting |
| notification | 3 | Low | Read/unread management |
| dashboard | 2 | Low | Read-only aggregation |
| audit-log | 2 | Low | Read-only |
| org-chart | 2 | Low | Read-only |
| upload | 2 | Low | S3 upload |
| setting | 2 | Low | Key-value settings |
| company-assignment | 3 | Low | HR Staff assignments |
| document-category | 3 | Low | Reference data |
| email | 1 | Low | Internal service only |

### Per-Module Checklist
When refactoring a module:
- [ ] Service: Replace `throw new Error(...)` with typed error classes
- [ ] Controller: Wrap with `asyncHandler()`, remove try-catch and `if (!req.user)`
- [ ] Routes: Add `validateBody()` / `validateQuery()` with Zod schemas
- [ ] Routes: Create Zod schema file in `src/validations/` if not exists
- [ ] Verify: `npx tsc --noEmit` passes
- [ ] Test: Manual smoke test of main endpoints
