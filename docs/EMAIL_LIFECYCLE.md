# Employee Email Lifecycle

## Email Fields

| Field | Table | Description |
|-------|-------|-------------|
| `email` | `users` | Login email (used for authentication) |
| `office_email` | `employees` | Company email (@pfigroups.com, @aggrecapital.com) |
| `personal_email` | `employees` | Personal email (gmail, etc.) |
| `email` | `employees` | Legacy field, sometimes has personal email |

## Lifecycle

### 1. Employee Created (by HR Manager)
```
employees.office_email = null or "<name>@<company_domain>"
employees.personal_email = "<personal@gmail.com>" (optional)
users.email = office_email || personal_email || "temp-<timestamp>@temp.local"
```
- User record auto-created with "Employee" role (level 7)
- If no email provided, a temp placeholder is used

### 2. Send Credentials (by SuperAdmin)

#### Case A: Has Office Email
```
1. Check if M365 account exists for office_email
2. If not → create M365 account
3. Assign license (optional)
4. Add to Distribution Lists (company DL + pattern-based)
5. Generate random password
6. Update users.email = office_email
7. Send credential email to office_email
```

#### Case B: No Office Email (PeopleHub-only)
```
1. Skip M365 entirely
2. Generate random password
3. Update users.email = personal_email (replaces temp)
4. Send credential email to personal_email
```

### 3. Temp Email Cleanup
- Temp emails (`*@temp.local`) are replaced when credentials are sent
- Table and modal show friendly "No email set" / "Not set yet" text
- Search/filter ignores temp emails

## Email Priority for Login
```
office_email (if valid, not temp) > personal_email > temp placeholder
```

## Data Rules
- Gmail/Yahoo in `office_email` → should be moved to `personal_email`
- `office_email` should only contain company domain emails
- Company domain is configured via `companies.email_domain`
