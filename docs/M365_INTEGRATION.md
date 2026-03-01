# Microsoft 365 Integration

## Overview

PeopleHub integrates with Microsoft 365 via Microsoft Graph API for:
1. Creating M365 user accounts
2. Assigning licenses
3. Auto-adding users to Distribution Lists

## Architecture

```
src/modules/microsoft365/microsoft365.service.ts  — Graph API client (singleton)
src/modules/user/user.service.ts                  — Orchestrates M365 in sendCredentials()
```

## Configuration

Environment variables:
```
M365_TENANT_ID=<Azure AD tenant ID>
M365_CLIENT_ID=<App registration client ID>
M365_CLIENT_SECRET=<App registration client secret>
```

Required Azure AD App permissions (Application type):
- `User.ReadWrite.All` — Create/read users
- `Directory.ReadWrite.All` — Manage group memberships
- `Organization.Read.All` — Read subscribed SKUs (licenses)

## Flow: Send Credentials

```
SuperAdmin clicks "Send Credentials"
  ├── Has office email?
  │   ├── YES → Check M365 for existing account
  │   │   ├── Exists → Get M365 user ID, assign license, add to DLs
  │   │   └── Not exists → Create M365 account, assign license, add to DLs
  │   └── NO → PeopleHub-only mode
  │       ├── Has personal email → Send credentials to personal email
  │       └── No email at all → Error
  └── Send email with login credentials
```

## Distribution Lists

### Company DLs
Each company has a `distribution_list_group_id` in the database. When a new M365 user is created, they are automatically added to their company's DL.

| Company | DL Email | Group ID |
|---------|----------|----------|
| PFI | all.pfi@pfigroups.com | `<stored in DB>` |
| GDI (Growpath) | all.pathfinder@pfigroups.com | `<stored in DB>` |
| LFS | all.lfs@pfigroups.com | `<stored in DB>` |
| BCI (BukaCerita) | all.bukacerita@pfigroups.com | `<stored in DB>` |
| UKI | all.uki@pfigroups.com | `<stored in DB>` |
| PDR | _(no DL yet)_ | `null` |

### Pattern-Based DLs
- `*.impact@pfigroups.com` → auto-added to `all.impact@pfigroups.com` (group ID: `c9ce3be1-8167-449a-a7cb-c307739d1cb4`)

### Email Domain Mapping
| Company | Email Domain |
|---------|-------------|
| PFI, GDI, LFS, BCI, UKI | `pfigroups.com` |
| PDR | `aggrecapital.com` |

## License Management

The system fetches available licenses from the tenant via `/subscribedSkus` and presents them in the UI. Common SKUs are mapped to friendly names in `skuDisplayNames`.

## API Methods

### `microsoft365Service.createUser(params)`
Creates a new M365 user with `forceChangePasswordNextSignIn: true` and `usageLocation: 'ID'`.

### `microsoft365Service.assignLicense(userId, skuId)`
Assigns a license SKU to a user. Failure doesn't throw (non-blocking).

### `microsoft365Service.addToGroup(userId, groupId)`
Adds user to a group/DL. Handles "already a member" gracefully.

### `microsoft365Service.autoAddToDistributionLists(userId, email, companyDLGroupId)`
Orchestrates: company DL + pattern-based Impact DL.

### `microsoft365Service.getAvailableLicenses()`
Returns all enabled SKUs with available unit counts.

### `microsoft365Service.getUserLicenses(email)`
Returns licenses assigned to a specific user.
