# Session Log

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
