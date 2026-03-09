# Session Log

## 2026-03-09 (Part 3) — Connect KPI + Attendance Reports to Real API

### What Was Done

#### 1. KPIDashboardPage Connected to Real KPI API
- **File**: `hr-next-frontend/src/pages/performance/KPIDashboardPage.tsx`
- Removed 4 mock data arrays: `kpiCategories` (12 KPIs), `departmentPerformance` (6 entries), `topPerformers` (5 entries), `quarterlyTrend` (5 entries)
- Connected to `kpiService.list({ limit: 100, is_active: true })` — groups KPIs by category dynamically
- KPI status derived from `benchmark_value` vs `threshold_green/yellow/red`
- Department section uses real `department_distribution` from group dashboard
- Company table shows real attendance/headcount data
- Created `src/services/kpi.service.ts` (new frontend service)

#### 2. AttendanceReportsPage Connected to Real Attendance API
- **File**: `hr-next-frontend/src/pages/analytics/AttendanceReportsPage.tsx`
- Removed 4 mock data arrays: `weeklyAttendance` (5 days), `monthlyTrend` (6 months), `departmentAttendance` (6 entries), `lateArrivals` (5 entries)
- Weekly attendance chart: fetches real attendance records for current week via `attendanceService.getAll()`, computes present/late/absent percentages per day
- Stats cards: derived from `dashboardService.getGroupOverview()` summary (total employees, avg attendance rate, on leave today)
- Department section: uses real `department_distribution` from group dashboard
- Company table: already used real data, improved to handle N/A attendance rates

### Files Created (Frontend)
- `src/services/kpi.service.ts` (NEW)

### Files Modified (Frontend)
- `src/pages/performance/KPIDashboardPage.tsx` (rewritten)
- `src/pages/analytics/AttendanceReportsPage.tsx` (rewritten)

### Pages Connected This Session (Total: 8 pages across 3 sessions)
- ContractsPage → contract API
- TeamAttendancePage → attendance API
- GoalsOKRsPage → goal API
- KPIDashboardPage → KPI API + dashboard API
- AttendanceReportsPage → attendance API + dashboard API

---

## 2026-03-09 (Part 2) — Connect Remaining Mock Pages to Real API

### What Was Done

#### 1. CEOCompanyGoalsPage Connected to Real Goal API
- **File**: `hr-next-frontend/src/pages/ceo/CEOCompanyGoalsPage.tsx`
- Removed all mock data (5 hardcoded goals)
- Connected to `goalService.list()` with status filtering
- Real stats (total, completed, active/in_progress, deferred/cancelled)
- Loading state, empty state
- Created `src/services/goal.service.ts` (new frontend service)

#### 2. PerformancePage Connected to Real Performance API
- **File**: `hr-next-frontend/src/pages/performance/PerformancePage.tsx`
- Removed all mock data (7 hardcoded reviews, 3 mock companies, 5 mock employees, 3 mock reviewers)
- Connected to `performanceService.listReviews()` with company/status filtering
- Connected to `companyService.getCompanies()` for company selector
- Real stats, detail modal, search
- Created `src/services/performance.service.ts` (new frontend service)

#### 3. CEOPerformanceSummaryPage Connected to Real API
- **File**: `hr-next-frontend/src/pages/ceo/CEOPerformanceSummaryPage.tsx`
- Removed all mock performance data (ratings array, department scores)
- Connected to `performanceService.listReviews()` to calculate real rating distribution
- Real avg rating, completion rate, top performers count, needs improvement count
- Rating distribution pie chart and department bar chart from real data

### Files Created (Frontend)
- `src/services/goal.service.ts` (NEW)
- `src/services/performance.service.ts` (NEW)

### Files Modified (Frontend)
- `src/pages/ceo/CEOCompanyGoalsPage.tsx` (rewritten)
- `src/pages/performance/PerformancePage.tsx` (rewritten)
- `src/pages/ceo/CEOPerformanceSummaryPage.tsx` (rewritten)

### Remaining Mock Data Pages (no backend API exists)
- **Tax module**: 6 pages (ESPT, eBupot, BPJS, NPWP, Annual/Monthly Reports)
- **CEO**: CEOTalentOverview, CEOOKRTracking, CEOBudgetRequests, CEOSuccessionPlanning
- **System Settings**: sub-pages (Coming Soon placeholders)
- **Security**: sub-pages (API Keys, Active Sessions, Login History)

---

## 2026-03-09 — Audit Trail Middleware + Frontend Mock Data Cleanup

### What Was Done

#### 1. Auto-Audit Trail Middleware (NEW)
- **File**: `src/middlewares/audit.middleware.ts`
- Automatically logs all mutating requests (POST/PUT/PATCH/DELETE) across 40+ modules
- Uses `res.on('finish')` pattern — runs after response, non-blocking
- Only logs successful responses (status < 400)
- Skips auth login/refresh, audit-logs, health, docs routes
- Maps 35 URL paths to model names
- Fire-and-forget `prisma.auditLog.create()` with silent catch
- Registered in `app.ts` after `requestLogger`

#### 2. Audit-Log Module Refactored (NEW pattern)
- **Controller** → `asyncHandler()`, arrow function properties, consistent `{ success, data }` response format
- **Service** → `NotFoundError` instead of generic `Error`, shared prisma client
- **Routes** → direct controller references (no wrapper functions)

#### 3. Frontend: AuditLogsPage Connected to Real API
- **File**: `hr-next-frontend/src/pages/admin/AuditLogsPage.tsx`
- Removed all mock data (8 hardcoded entries)
- Connected to `GET /audit-logs` (paginated list), `GET /audit-logs/statistics`, `GET /audit-logs/:id` (detail), `GET /audit-logs/export` (CSV export)
- Added pagination, server-side filtering by model/action, client-side search
- Created `src/services/audit-log.service.ts` (new frontend service)

#### 4. Frontend: RolesPage Connected to Real RBAC API
- **File**: `hr-next-frontend/src/pages/admin/RolesPage.tsx`
- Removed all mock data (7 hardcoded roles + permission modules)
- Connected to `rbacService.getRoles()`, `rbacService.getPermissions()`, `rbacService.getUserPermissions()`
- Real permission grouping from API data
- Working delete with confirmation

#### 5. Frontend: TeamOvertimePage Connected to Real API
- **File**: `hr-next-frontend/src/pages/manager/TeamOvertimePage.tsx`
- Removed all mock data (7 hardcoded overtime requests)
- Connected to `overtimeService.list()`, `overtimeService.approve()`, `overtimeService.reject()`
- Real stats from API data, loading states, action feedback

### Files Modified (Backend)
- `src/middlewares/audit.middleware.ts` (NEW)
- `src/app.ts` (added audit middleware)
- `src/modules/audit-log/audit-log.controller.ts` (rewritten)
- `src/modules/audit-log/audit-log.service.ts` (updated imports + error class)
- `src/modules/audit-log/audit-log.routes.ts` (simplified)

### Files Modified (Frontend)
- `src/services/audit-log.service.ts` (NEW)
- `src/pages/admin/AuditLogsPage.tsx` (rewritten)
- `src/pages/admin/RolesPage.tsx` (rewritten)
- `src/pages/manager/TeamOvertimePage.tsx` (rewritten)

### Remaining Mock Data Pages (not addressed this session)
- **Tax module**: 6 pages (no backend API exists)
- **CEO module**: 5 pages (partial backend)
- **System Settings**: 4 pages (Coming Soon)
- **Security**: 3 pages (Coming Soon)

---

## 2026-03-07 — Auth Refactor, M365 Fix, Allowance Frequency Logic

### What Was Done

#### 1. Auth Module Refactored (NEW pattern)
- `auth.controller.ts` → `asyncHandler()`, no try-catch, `req.user!`
- `auth.service.ts` → typed errors (UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError)
- `auth.routes.ts` → `validateBody()` middleware on all POST routes
- `auth.schema.ts` → synced to camelCase field names, removed unused registerSchema

#### 2. M365 User Creation Fix
- **Problem**: First Name/Last Name not set in M365 when creating users
- **Fix** (`microsoft365.service.ts`): Split `displayName` into `givenName` + `surname` and pass to Graph API

#### 3. Allowance Create 400 Fix
- **Problem**: `effective_date: "2026-03-06"` rejected by Prisma (expects DateTime)
- **Fix** (`allowance.service.ts`): Wrap with `new Date()` conversion

#### 4. Allowance Frequency Logic in Payroll
- **Problem**: Frequency field (monthly/weekly/daily/one_time) was just metadata — payroll didn't differentiate
- **Fix** (`payroll.service.ts`):
  - Added `id` and `frequency` to allowance query
  - Check previous payrolls for already-paid one_time allowances (via `allowance_id` in `allowances_detail` JSON)
  - Filter out already-paid one_time allowances from current payroll
  - Store `allowance_id` and `frequency` in allowance details JSON
  - Auto-deactivate one_time allowances (status → 'paid') after payroll generation
  - Fixed Prisma Json null filter: `Prisma.JsonNull` instead of plain `null`

#### 5. Leave Type Visibility Fix
- **Problem**: 3 leave types (Paternity, Marriage, Bereavement) had `company_id: 1` instead of null → only visible to one company
- **Fix**: Set `company_id = null` to make them global

#### 6. Documentation Created
- `CLAUDE.md` (backend + frontend)
- `docs/PROGRESS.md` — full module tracking
- `docs/M365_INTEGRATION.md`, `docs/EMAIL_LIFECYCLE.md`

### Files Modified
- `src/modules/auth/auth.controller.ts` (rewritten)
- `src/modules/auth/auth.service.ts` (rewritten)
- `src/modules/auth/auth.routes.ts` (rewritten)
- `src/validations/auth.schema.ts` (rewritten)
- `src/modules/microsoft365/microsoft365.service.ts` (givenName/surname)
- `src/modules/allowance/allowance.service.ts` (date conversion)
- `src/modules/payroll/payroll.service.ts` (frequency logic)

### Pending / Discussed
- **Manager leave approval**: Stella can't approve Atyanta's leave (leave_approver_id=60 Rahmi overrides manager_id=46 Stella) — not resolved
- **Sentry DOM errors**: Browser extension noise (removeChild/insertBefore) — not critical

---

## 2026-03-02 — Email Cleanup, M365 DL, Credential Fix

### What Was Done

#### 1. Send Credentials Fix (Backend + Frontend)
- **Problem**: Modal showed M365 setup even for employees without office email. Temp email (`temp-xxx@temp.local`) persisted as login after sending credentials.
- **Fix Backend** (`user.service.ts`):
  - Introduced `loginEmail` variable — falls back to personal email when office email is temp/invalid
  - PeopleHub-only mode sends to personal email when no office email
  - Fixed line 503 `email: officeEmail` → `email: loginEmail`
- **Fix Frontend** (`UsersPage.tsx`):
  - "No office email" info box with optional M365 setup toggle
  - Table shows "No email set" instead of ugly temp emails
  - Modal shows "Not set yet" for temp login emails

#### 2. Auto-Assign Employee Role
- **Problem**: HR Manager creates employee → no role assigned → can't login properly
- **Fix** (`employee.service.ts`): Auto-assign "Employee" role (level 7) on user creation via `userRoles.create` with `name_guard_name` unique constraint lookup

#### 3. Search Debounce Race Condition
- **Problem**: Typing fast in UsersPage search caused broken/stale results
- **Fix** (`UsersPage.tsx`): Used `useRef` for search value, separated page/search effects, 400ms debounce

#### 4. Microsoft 365 Distribution Lists
- **New feature** (`microsoft365.service.ts`):
  - `addToGroup(userId, groupId)` — adds user to M365 group/DL
  - `autoAddToDistributionLists(userId, email, companyDLGroupId)` — company DL + pattern-based Impact DL
- **Schema** (`prisma/schema.prisma`): Added `distribution_list_group_id` to Company model
- **Integration** (`user.service.ts`): Calls `autoAddToDistributionLists()` after M365 user creation/detection
- **DB**: Set `distribution_list_group_id` for all companies

#### 5. Company Email Domain Setup
- **Problem**: Companies had `email_domain = null` → modal couldn't detect office email
- **DB Fix**: Set `email_domain` for all companies:
  - PFI, GDI (Growpath), LFS, BCI (BukaCerita), UKI → `pfigroups.com`
  - PDR → `aggrecapital.com`

#### 6. Email Data Cleanup (All Companies)
Moved gmail/personal emails from `office_email` to `personal_email`, verified against M365:

| Company | Employees Fixed | Notes |
|---------|----------------|-------|
| PDR | 68 moved to personal, 12 kept @aggrecapital.com | Bulk update |
| GDI | ~10 updated | 3 intentionally no office email |
| BCI | ~5 updated | 2 intentionally personal email |
| UKI | ~3 updated | 2 intentionally personal email |
| PFI | 0 (2 are resigned) | Already clean |
| LFS | Previously cleaned | — |

### Files Modified
- `src/modules/user/user.service.ts`
- `src/modules/employee/employee.service.ts`
- `src/modules/microsoft365/microsoft365.service.ts`
- `prisma/schema.prisma`
- Frontend: `src/pages/admin/UsersPage.tsx` (separate repo)

### Pending / Discussed
- **Edit Approval Workflow**: HR Manager needs Group CEO approval to edit employee data. Discussed concept (locked edits, approval window, auto-lock timer) but NOT implemented. User hasn't confirmed final requirements.

---

## Previous Sessions

_(Add entries above this line for future sessions)_
