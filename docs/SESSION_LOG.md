# Session Log

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
