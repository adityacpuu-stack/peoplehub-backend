# PeopleHub Backend — Full Progress

## Refactoring Pattern

Reference implementation: `employee` module
- Controller: `asyncHandler()`, no try-catch, `req.user!`
- Service: throws typed errors (`NotFoundError`, `ForbiddenError`, etc.)
- Routes: `validateBody(schema)` / `validateQuery(schema)`
- Schema: `src/validations/<module>.schema.ts`

---

## Module Progress

### Auth & Security

| Module | Endpoints | Pattern | Features |
|--------|-----------|---------|----------|
| `auth` | login, logout, refresh, me, change-password, forgot-password, reset-password | **NEW** | IP tracking, account lockout, token rotation |
| `user` | CRUD, toggle status, send credentials, stats | PARTIAL | M365 integration, license picker, credential email, notification prefs |
| `rbac` | CRUD roles, CRUD permissions, assign role/permission to user | OLD | Permission groups, seed roles, role hierarchy |

### Organization

| Module | Endpoints | Pattern | Features |
|--------|-----------|---------|----------|
| `company` | CRUD, stats, settings | OLD | Company hierarchy, feature toggles (attendance/leave/payroll/performance) |
| `department` | CRUD | OLD | Hierarchy tree, filter by company |
| `position` | CRUD | OLD | Filter by company/department, position levels |
| `work-location` | CRUD | OLD | Geolocation, nearby locations with radius |
| `org-chart` | get full chart, get subtree | OLD | Tree visualization, depth limiting |

### Employee Management

| Module | Endpoints | Pattern | Features |
|--------|-----------|---------|----------|
| `employee` | CRUD, profile update, profile completion | **NEW** | Excel export, subordinates tree, leadership team, next employee ID, self-service profile |
| `employee-movement` | CRUD + approve/reject | OLD | Transfer/promotion approval workflow, statistics |
| `company-assignment` | CRUD + bulk assign | OLD | Multi-company HR Staff assignments, my assignments |
| `contract` | CRUD + activate/renew/terminate | OLD | Expiring contracts, active contract lookup, group stats |

### Attendance & Leave

| Module | Endpoints | Pattern | Features |
|--------|-----------|---------|----------|
| `attendance` | CRUD, check-in/out, break start/end | OLD | Today's attendance, history, summary (individual + team) |
| `attendance-setting` | CRUD + security rules | OLD | Company-specific settings, reset to default |
| `leave` | CRUD + approve/reject/cancel | OLD | Leave balances, allocation, adjustment, team leaves, pending approvals |
| `leave-type` | CRUD types + entitlements + balances | OLD | Seed defaults, carry-forward, initialization |
| `overtime` | CRUD + approve/reject/cancel | OLD | Bulk operations, pending approvals, my overtimes |

### Payroll & Compensation

| Module | Endpoints | Pattern | Features |
|--------|-----------|---------|----------|
| `payroll` | CRUD, calculate, validate, submit, approve, reject | OLD | Bulk ops, Excel export, freelance/internship export, mark as paid, my payslips, THR & bonus |
| `payroll-setting` | CRUD + tax config | OLD | TER, progressive tax, PTKP, tax brackets, seed data |
| `payroll-adjustment` | CRUD + approve/reject | OLD | Bulk ops, recurring adjustments, statistics |
| `salary-component` | CRUD | OLD | By code, earnings/deductions filter, seed defaults |
| `salary-grade` | CRUD | OLD | By code, assign employees, salary range analysis, seed defaults |
| `allowance` | CRUD + approve | OLD | Bulk ops, recurring/one-time, monthly calculation, templates, statistics |
| `benefit` | CRUD | OLD | Filter by type/category, seed defaults, statistics |

### Performance

| Module | Endpoints | Pattern | Features |
|--------|-----------|---------|----------|
| `performance` | Reviews, goals, KPIs, feedback | OLD | Self-assessment, manager review, team reviews, goal progress, KPI assignment |
| `performance-cycle` | CRUD + lifecycle | OLD | Activate → start review → calibration → complete, statistics |
| `goal` | CRUD + progress | OLD | Manager feedback, employee comments, team goals, overdue tracking |
| `kpi` | CRUD | OLD | By department/position/category, assign to dept/position, seed defaults |

### Communication & Documents

| Module | Endpoints | Pattern | Features |
|--------|-----------|---------|----------|
| `notification` | List, unread count, mark read, delete | OLD | Pagination, unread filter, popup dismissal |
| `announcement` | CRUD + publish/pin | OLD | Category, priority, visibility, view tracking, statistics |
| `document` | CRUD company docs + employee docs | OLD | Verification workflow, expiration tracking, archive, completeness check |
| `document-category` | CRUD | OLD | Hierarchical categories |
| `template` | CRUD | OLD | Visible to all employees |
| `form-template` | CRUD | OLD | Custom form templates |

### System & Integrations

| Module | Endpoints | Pattern | Features |
|--------|-----------|---------|----------|
| `dashboard` | Overview, quick stats, summaries | OLD | Personal/team/CEO dashboards, workforce/turnover/headcount analytics |
| `setting` | CRUD + bulk update | OLD | Settings groups, maintenance mode, public settings, seed defaults |
| `audit-log` | List, filter, export, cleanup | **NEW** | Auto-audit middleware, by model/user, my activity, statistics, IP tracking |
| `upload` | Single/multi upload, delete, presigned URL | OLD | S3/DigitalOcean Spaces, folder-based (templates, documents, avatars) |
| `microsoft365` | Create user, assign license, manage DLs | N/A (service only) | Auto-add to company DL + Impact DL |
| `email` | Send various email types | N/A (service only) | Resend API, templates for credentials/reset/notifications |
| `holiday` | CRUD | OLD | Public holiday management |

---

## Refactoring Scorecard

| Status | Count | Modules |
|--------|-------|---------|
| **NEW** (fully refactored) | 3 | `employee`, `auth`, `audit-log` |
| **PARTIAL** | 1 | `user` |
| **OLD** (needs refactoring) | 37 | All others |
| **Service-only** (no controller) | 2 | `microsoft365`, `email` |

### Next Priority
1. ~~`auth`~~ — DONE
2. `rbac` — permission system, high impact
3. `attendance` — high usage
4. `leave` — high usage
5. `payroll` — complex, high usage

---

## Validation Schemas

Zod schemas in `src/validations/`:

| Schema | Status |
|--------|--------|
| `common.schema.ts` | Base schemas (pagination, email, phone, enums) |
| `employee.schema.ts` | WIRED to routes |
| `auth.schema.ts` | WIRED to routes |
| `attendance.schema.ts` | Created, not wired |
| `overtime.schema.ts` | Created, not wired |
| `leave.schema.ts` | Created, not wired |
| `payroll.schema.ts` | Created, not wired |
| `document.schema.ts` | Created, not wired |
| `rbac.schema.ts` | Created, not wired |
| `contract.schema.ts` | Created, not wired |
| `user.schema.ts` | Created, not wired |
| `allowance.schema.ts` | Created, not wired |
| `benefit.schema.ts` | Created, not wired |
| `salary-component.schema.ts` | Created, not wired |
| `salary-grade.schema.ts` | Created, not wired |
| `payroll-adjustment.schema.ts` | Created, not wired |
| `payroll-setting.schema.ts` | Created, not wired |
| `performance.schema.ts` | Created, not wired |
| `performance-cycle.schema.ts` | Created, not wired |
| `goal.schema.ts` | Created, not wired |
| `kpi.schema.ts` | Created, not wired |
| `notification.schema.ts` | Created, not wired |
| `announcement.schema.ts` | Created, not wired |
| `document-category.schema.ts` | Created, not wired |
| `employee-movement.schema.ts` | Created, not wired |
| `company-assignment.schema.ts` | Created, not wired |
| `attendance-setting.schema.ts` | Created, not wired |
| `leave-type.schema.ts` | Created, not wired |
| `holiday.schema.ts` | Created, not wired |
| `work-location.schema.ts` | Created, not wired |
| `setting.schema.ts` | Created, not wired |
| `template.schema.ts` | Created, not wired |
| `form-template.schema.ts` | Created, not wired |
| `dashboard.schema.ts` | Created, not wired |
| `org-chart.schema.ts` | Created, not wired |
| `audit-log.schema.ts` | Created, not wired |

---

## Feature Changelog (Recent)

| Date | Type | Description |
|------|------|-------------|
| 2026-03-09 | feat | Frontend: KPIDashboardPage connected to real KPI API (was mock data) |
| 2026-03-09 | feat | Frontend: AttendanceReportsPage connected to real attendance + dashboard API (was mock data) |
| 2026-03-09 | feat | Frontend: ContractsPage, TeamAttendancePage, GoalsOKRsPage connected to real APIs |
| 2026-03-09 | feat | Frontend: CEOCompanyGoalsPage connected to real goal API (was mock data) |
| 2026-03-09 | feat | Frontend: PerformancePage connected to real performance review API (was mock data) |
| 2026-03-09 | feat | Frontend: CEOPerformanceSummaryPage connected to real performance API (was mock data) |
| 2026-03-09 | feat | Auto-audit middleware — logs all mutations (POST/PUT/PATCH/DELETE) across 40+ modules |
| 2026-03-09 | refactor | Audit-log module → new pattern (asyncHandler + typed errors + consistent response format) |
| 2026-03-09 | feat | Frontend: AuditLogsPage connected to real API (was mock data) |
| 2026-03-09 | feat | Frontend: RolesPage connected to real RBAC API (was mock data) |
| 2026-03-09 | feat | Frontend: TeamOvertimePage connected to real overtime API (was mock data) |
| 2026-03-02 | refactor | Auth module → new pattern (asyncHandler + typed errors + validateBody) |
| 2026-03-02 | docs | Added CLAUDE.md, PROGRESS.md, SESSION_LOG.md, M365_INTEGRATION.md, EMAIL_LIFECYCLE.md |
| 2026-03-01 | feat | M365 Distribution List auto-assignment on credential send |
| 2026-03-01 | fix | Temp email replaced with personal email as login |
| 2026-03-01 | feat | Auto-assign Employee role on HR Manager create |
| 2026-03-01 | fix | Send credentials handles employees without office email |
| 2026-02-28 | feat | M365 integration: create user, assign license, detect existing |
| 2026-02-28 | feat | Send credentials endpoint for superadmin |
| 2026-02-26 | fix | THR and Bonus in payroll calculation and Excel export |
| 2026-02-24 | feat | Employee Excel export (family card, personal email, work location) |
| 2026-02-24 | feat | Profile completion (personal data fields, name update) |
| 2026-02-22 | fix | Payroll allowance double-counting fixes |
| 2026-02-20 | feat | Loan/kasbon tracking for deductions |
| 2026-02-18 | feat | HR Staff role access for compensation and payroll |
| 2026-02-15 | feat | Employee data export to Excel |
| 2026-02-12 | feat | Freelance/internship payroll export |
| 2026-02-10 | refactor | Departments made global (no company_id requirement) |
| 2026-02-08 | feat | Upload module (S3/DigitalOcean Spaces) |
| 2026-02-05 | feat | Switch to Resend for email delivery |
| 2026-02-01 | chore | Migrate database from MySQL to PostgreSQL |

---

## Pending / Planned

- **Edit Approval Workflow** — HR Manager needs Group CEO approval to edit employee data (discussed, not implemented)
- **React Query migration** — Frontend has it installed but unused
- **Refactor remaining 37 modules** to new pattern
- **Wire validation schemas** to routes for all modules
