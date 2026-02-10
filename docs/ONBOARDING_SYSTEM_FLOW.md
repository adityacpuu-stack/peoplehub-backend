# Employee Onboarding System - Full Flow Documentation

> **Version**: 1.1
> **Last Updated**: February 2025
> **Author**: PeopleHub Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [System Flow Diagram](#system-flow-diagram)
3. [Phase 1: HR Creates Invitation](#phase-1-hr-creates-onboarding-invitation)
4. [Phase 2: Email Notification](#phase-2-email-sent-to-new-employee)
5. [Phase 3: Employee Fills Form](#phase-3-employee-fills-onboarding-form)
6. [Phase 4: HR Review & Approval](#phase-4-hr-reviews--approves)
7. [Phase 5: Auto Provisioning](#phase-5-auto-provisioning)
8. [Phase 6: Welcome Email](#phase-6-welcome-email-with-credentials)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [Frontend Pages](#frontend-pages)
12. [Microsoft 365 Integration](#microsoft-365-integration)
13. [Email Notification System](#email-notification-system)
14. [Data Mapping (Onboarding → Employee)](#data-mapping-onboarding--employee)
15. [Implementation Phases](#implementation-phases)

---

## Overview

The Employee Onboarding System streamlines the process of bringing new employees into the organization. It automates:

- **Data Collection**: New employees fill their information via a secure link
- **Document Management**: Upload and verify required documents
- **Account Provisioning**: Automatic creation of PeopleHub and Microsoft 365 accounts
- **Workflow Management**: HR review and approval process

### Key Features

| Feature | Description |
|---------|-------------|
| **Self-Service Portal** | Employees complete their profile without HR intervention |
| **Document Upload** | Secure upload of KTP, NPWP, certificates, etc. |
| **Multi-Step Form** | Guided wizard for better UX |
| **Auto Provisioning** | Automatic account creation upon approval |
| **M365 Integration** | Azure AD user creation with license assignment |
| **Email Notifications** | Automated emails at each stage |

---

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ONBOARDING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. HR Creates Invitation                                                │
│     ├── Input: Name, Personal Email, Position, Department, Start Date   │
│     └── System generates unique link                                     │
│                           ↓                                              │
│  2. Email Sent to New Employee                                          │
│     └── Link: https://onboarding.peoplehub.com/invite/{token}           │
│                           ↓                                              │
│  3. Employee Fills Form (Public Page)                                   │
│     ├── Personal Info (KTP, NPWP, address, etc.)                        │
│     ├── Bank Details                                                     │
│     ├── Emergency Contact                                                │
│     └── Upload Documents (KTP, photo, etc.)                             │
│                           ↓                                              │
│  4. HR Reviews & Approves                                               │
│                           ↓                                              │
│  5. Auto Provisioning                                                    │
│     ├── Create Employee record in PeopleHub                             │
│     ├── Create User account (login credentials)                         │
│     ├── Create Microsoft 365 account (via Graph API)                    │
│     └── Send welcome email with credentials                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Status Flow

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐    ┌───────────┐
│  DRAFT   │ -> │  PENDING  │ -> │ SUBMITTED│ -> │ APPROVED  │ -> │ COMPLETED │
└──────────┘    └───────────┘    └──────────┘    └───────────┘    └───────────┘
     │               │                │               │
     │               │                │               └── Can be REJECTED
     │               │                └── Waiting HR Review
     │               └── Waiting Employee to Fill Form
     └── HR creating invitation (not sent yet)
```

---

## Phase 1: HR Creates Onboarding Invitation

### UI Mockup

```
┌────────────────────────────────────────────────────────────────────────────┐
│  HR Dashboard → Onboarding → Create New Invitation                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  CREATE ONBOARDING INVITATION                                        │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  Full Name*:        [John Doe                              ]        │  │
│  │  Personal Email*:   [johndoe@gmail.com                     ]        │  │
│  │  Phone Number:      [+62 812 3456 7890                     ]        │  │
│  │                                                                      │  │
│  │  ─────────────────── Employment Details ───────────────────         │  │
│  │                                                                      │  │
│  │  Company*:          [▼ PT PFI Mega Life Insurance          ]        │  │
│  │  Department*:       [▼ IT Department                       ]        │  │
│  │  Position*:         [Software Engineer                     ]        │  │
│  │  Employment Type*:  [▼ Permanent                           ]        │  │
│  │  Start Date*:       [📅 2025-02-01                         ]        │  │
│  │  Reports To:        [▼ Select Manager                      ]        │  │
│  │                                                                      │  │
│  │  ─────────────────── Compensation ─────────────────────────         │  │
│  │                                                                      │  │
│  │  Basic Salary*:     [Rp 15,000,000                         ]        │  │
│  │  BPJS Enrollment:   [✓] Kesehatan  [✓] Ketenagakerjaan              │  │
│  │                                                                      │  │
│  │  ─────────────────── Account Setup ────────────────────────         │  │
│  │                                                                      │  │
│  │  Work Email*:       [john.doe@pfigroups.com                ]        │  │
│  │  Create M365:       [✓] Create Microsoft 365 Account                │  │
│  │  M365 License:      [▼ Microsoft 365 Business Basic        ]        │  │
│  │                                                                      │  │
│  │  Invitation Expiry: [▼ 7 days                              ]        │  │
│  │                                                                      │  │
│  │              [Cancel]                    [Send Invitation]          │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Backend Process

```typescript
async function createOnboardingInvitation(data: CreateInvitationDTO) {
  // 1. Validate input data
  validateInvitationData(data);

  // 2. Check if email already exists
  const existingEmployee = await checkExistingEmployee(data.personal_email, data.work_email);
  if (existingEmployee) {
    throw new Error('Employee with this email already exists');
  }

  // 3. Generate unique token
  const token = generateSecureToken(); // UUID + hash

  // 4. Calculate expiry date
  const expiresAt = addDays(new Date(), data.expiry_days || 7);

  // 5. Create invitation record
  const invitation = await prisma.onboardingInvitation.create({
    data: {
      token,
      full_name: data.full_name,
      personal_email: data.personal_email,
      phone: data.phone,
      company_id: data.company_id,
      department_id: data.department_id,
      position: data.position,
      employment_type: data.employment_type,
      start_date: data.start_date,
      manager_id: data.manager_id,
      basic_salary: data.basic_salary,
      work_email: data.work_email,
      create_m365_account: data.create_m365_account,
      m365_license_type: data.m365_license_type,
      status: 'pending',
      expires_at: expiresAt,
      created_by: currentUserId,
    }
  });

  // 6. Send invitation email
  await sendInvitationEmail(invitation);

  return invitation;
}
```

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| full_name | string | Yes | Employee's full legal name |
| personal_email | string | Yes | Personal email for invitation |
| phone | string | No | Phone number |
| company_id | number | Yes | Target company |
| department_id | number | Yes | Target department |
| position | string | Yes | Job title |
| employment_type | enum | Yes | permanent/contract/freelance/internship |
| start_date | date | Yes | Employment start date |
| manager_id | number | No | Direct supervisor |
| basic_salary | decimal | Yes | Monthly basic salary |
| work_email | string | Yes | Company email address |
| create_m365_account | boolean | No | Create M365 account |
| m365_license_type | string | No | M365 license SKU |
| expiry_days | number | No | Invitation validity (default: 7) |

---

## Phase 2: Email Sent to New Employee

### Email Template

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL TO: johndoe@gmail.com                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Subject: Welcome to PT PFI Mega Life Insurance - Complete Your Profile   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │                    [COMPANY LOGO]                                   │  │
│  │                                                                      │  │
│  │  Dear John Doe,                                                     │  │
│  │                                                                      │  │
│  │  Selamat bergabung dengan PT PFI Mega Life Insurance!               │  │
│  │                                                                      │  │
│  │  Kami sangat senang menyambut Anda sebagai Software Engineer        │  │
│  │  di IT Department, mulai tanggal 1 Februari 2025.                   │  │
│  │                                                                      │  │
│  │  Untuk melengkapi proses onboarding, silakan klik tombol            │  │
│  │  di bawah ini untuk mengisi data diri Anda:                         │  │
│  │                                                                      │  │
│  │           ┌─────────────────────────────────────┐                   │  │
│  │           │    COMPLETE YOUR PROFILE    →       │                   │  │
│  │           └─────────────────────────────────────┘                   │  │
│  │                                                                      │  │
│  │  Link ini akan kadaluarsa pada: 10 Februari 2025, 23:59 WIB         │  │
│  │                                                                      │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │                                                                      │  │
│  │  Jika Anda memiliki pertanyaan, silakan hubungi:                    │  │
│  │  HR Department: hr@pfigroups.com | +62 21 1234 5678                 │  │
│  │                                                                      │  │
│  │  Salam hangat,                                                      │  │
│  │  HR Team - PT PFI Mega Life Insurance                               │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

Link URL: https://hr.pfigroups.com/onboarding/complete/{token}
```

### Email Service Implementation

```typescript
async function sendInvitationEmail(invitation: OnboardingInvitation) {
  const company = await getCompany(invitation.company_id);
  const onboardingUrl = `${process.env.FRONTEND_URL}/onboarding/complete/${invitation.token}`;

  await emailService.send({
    to: invitation.personal_email,
    subject: `Welcome to ${company.name} - Complete Your Profile`,
    template: 'onboarding-invitation',
    data: {
      name: invitation.full_name,
      company_name: company.name,
      company_logo: company.logo_url,
      position: invitation.position,
      department: invitation.department.name,
      start_date: formatDate(invitation.start_date),
      onboarding_url: onboardingUrl,
      expiry_date: formatDateTime(invitation.expires_at),
      hr_email: company.hr_email,
      hr_phone: company.hr_phone,
    }
  });
}
```

---

## Phase 3: Employee Fills Onboarding Form

### Public Page - Multi-Step Form

The onboarding form is a public page (no authentication required) accessible via the unique token.

#### Landing Page

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🌐 https://hr.pfigroups.com/onboarding/complete/abc123xyz...              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  [COMPANY LOGO]              Employee Onboarding Portal             │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  Welcome, John Doe!                                                 │  │
│  │  Please complete your profile to finish the onboarding process.     │  │
│  │                                                                      │  │
│  │  Position: Software Engineer | Department: IT Department            │  │
│  │  Start Date: 1 February 2025                                        │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  Progress: ████████░░░░░░░░░░░░ 40%                                 │  │
│  │                                                                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Personal │→│ Address  │→│  Family  │→│   Bank   │→│Documents │  │  │
│  │  │   Info   │ │          │ │ & Contact│ │  Details │ │  Upload  │  │  │
│  │  │    ✓     │ │  Current │ │          │ │          │ │          │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Step 1: Personal Information

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Personal Information                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │                 │  Full Name*:    John Doe (from invitation)        │
│  │   [Upload       │                                                    │
│  │    Photo]       │  NIK (KTP)*:    [3171234567890001        ]        │
│  │                 │                                                    │
│  │  Max 2MB        │  Place of Birth*: [Jakarta               ]        │
│  │  JPG/PNG        │  Date of Birth*:  [📅 1990-05-15         ]        │
│  └─────────────────┘                                                    │
│                                                                         │
│  Gender*:         (●) Male  ( ) Female                                  │
│  Religion*:       [▼ Islam                              ]               │
│  Marital Status*: [▼ Single                             ]               │
│  Blood Type:      [▼ O                                  ]               │
│                                                                         │
│  NPWP:            [12.345.678.9-012.000                 ]               │
│  BPJS Kesehatan:  [0001234567890                        ]               │
│  BPJS TK:         [12345678901                          ]               │
│                                                                         │
│  Phone Number*:   [+62 812 3456 7890                    ]               │
│  Personal Email:  johndoe@gmail.com (from invitation)                   │
│                                                                         │
│                                          [Save & Continue →]            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| photo | file | Yes | JPG/PNG, max 2MB |
| nik | string | Yes | 16 digits |
| place_of_birth | string | Yes | - |
| date_of_birth | date | Yes | Must be 17+ years old |
| gender | enum | Yes | male/female |
| religion | enum | Yes | islam/kristen/katolik/hindu/buddha/konghucu/other |
| marital_status | enum | Yes | single/married/divorced/widowed |
| blood_type | enum | No | A/B/AB/O |
| npwp | string | No | Format: XX.XXX.XXX.X-XXX.XXX |
| bpjs_kesehatan | string | No | 13 digits |
| bpjs_ketenagakerjaan | string | No | 11 digits |
| phone | string | Yes | Valid phone format |

#### Step 2: Address Information

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Address Information                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ──────────────── KTP Address (Alamat Sesuai KTP) ────────────────      │
│                                                                         │
│  Address*:        [Jl. Sudirman No. 123                  ]              │
│  RT/RW:           [001] / [002]                                         │
│  Kelurahan*:      [Karet Semanggi                       ]              │
│  Kecamatan*:      [Setiabudi                            ]              │
│  City*:           [Jakarta Selatan                      ]              │
│  Province*:       [DKI Jakarta                          ]              │
│  Postal Code*:    [12930                                ]              │
│                                                                         │
│  ──────────────── Current Address (Alamat Domisili) ──────────────      │
│                                                                         │
│  [✓] Same as KTP Address                                                │
│                                                                         │
│  Address:         [                                     ]               │
│  RT/RW:           [   ] / [   ]                                         │
│  Kelurahan:       [                                     ]               │
│  Kecamatan:       [                                     ]               │
│  City:            [                                     ]               │
│  Province:        [                                     ]               │
│  Postal Code:     [                                     ]               │
│                                                                         │
│                        [← Back]        [Save & Continue →]              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 3: Family & Emergency Contact

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Family & Emergency Contact                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ──────────────── Emergency Contact ────────────────────────            │
│                                                                         │
│  Contact Name*:   [Jane Doe                             ]               │
│  Relationship*:   [▼ Spouse / Parent / Sibling          ]               │
│  Phone Number*:   [+62 812 9876 5432                    ]               │
│  Address:         [Jl. Thamrin No. 456, Jakarta         ]               │
│                                                                         │
│  ──────────────── Family Members (Optional) ────────────────            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Name          │ Relationship │ Birth Date  │ Occupation │  ✕    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Jane Doe      │ Spouse       │ 1992-03-20  │ Teacher    │  [x]  │   │
│  │ Baby Doe      │ Child        │ 2020-08-15  │ -          │  [x]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [+ Add Family Member]                                                  │
│                                                                         │
│                        [← Back]        [Save & Continue →]              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Relationship Options:**
- Spouse (Suami/Istri)
- Parent (Orang Tua)
- Child (Anak)
- Sibling (Saudara Kandung)
- Other (Lainnya)

#### Step 4: Bank Account Details

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Bank Account Details                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️ Please ensure bank details are correct for salary payment.          │
│                                                                         │
│  Bank Name*:      [▼ Bank Central Asia (BCA)            ]               │
│  Branch:          [KCP Sudirman                         ]               │
│  Account Number*: [1234567890                           ]               │
│  Account Name*:   [JOHN DOE                             ]               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⓘ Account name must match your legal name (as per KTP)          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                        [← Back]        [Save & Continue →]              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Supported Banks:**
- Bank Central Asia (BCA)
- Bank Mandiri
- Bank Negara Indonesia (BNI)
- Bank Rakyat Indonesia (BRI)
- Bank CIMB Niaga
- Bank Danamon
- Bank Permata
- Bank OCBC NISP
- Bank Maybank
- Other

#### Step 5: Document Upload

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Document Upload                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Please upload the following documents (PDF/JPG/PNG, max 5MB each)      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Document              │ Status      │ Action                    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ KTP (ID Card)*        │ ✓ Uploaded  │ [View] [Replace]          │   │
│  │ KK (Family Card)*     │ ⏳ Required │ [Upload]                  │   │
│  │ NPWP                  │ ○ Optional  │ [Upload]                  │   │
│  │ Ijazah Terakhir*      │ ⏳ Required │ [Upload]                  │   │
│  │ Transkrip Nilai       │ ○ Optional  │ [Upload]                  │   │
│  │ Surat Lamaran         │ ○ Optional  │ [Upload]                  │   │
│  │ CV/Resume             │ ○ Optional  │ [Upload]                  │   │
│  │ Pas Photo 3x4*        │ ✓ Uploaded  │ [View] [Replace]          │   │
│  │ SKCK                  │ ○ Optional  │ [Upload]                  │   │
│  │ Surat Keterangan Sehat│ ○ Optional  │ [Upload]                  │   │
│  │ Buku Rekening (Cover)*│ ⏳ Required │ [Upload]                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  * Required documents                                                   │
│                                                                         │
│                        [← Back]        [Submit Application →]           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Document Types:**

| Document | Code | Required | Description |
|----------|------|----------|-------------|
| KTP | ktp | Yes | Kartu Tanda Penduduk |
| Kartu Keluarga | kk | Yes | Family Card |
| NPWP | npwp | No | Tax ID Card |
| Ijazah Terakhir | ijazah | Yes | Latest Certificate |
| Transkrip Nilai | transkrip | No | Academic Transcript |
| Surat Lamaran | lamaran | No | Application Letter |
| CV/Resume | cv | No | Curriculum Vitae |
| Pas Photo 3x4 | photo_3x4 | Yes | ID Photo |
| SKCK | skck | No | Police Clearance |
| Surat Keterangan Sehat | surat_sehat | No | Health Certificate |
| Buku Rekening | buku_rekening | Yes | Bank Book Cover |

#### Submission Confirmation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                           ✓                                             │
│                                                                         │
│                  Thank You, John!                                       │
│                                                                         │
│     Your onboarding information has been submitted successfully.        │
│                                                                         │
│     ─────────────────────────────────────────────────────────          │
│                                                                         │
│     What happens next?                                                  │
│                                                                         │
│     1. HR will review your submitted information                        │
│     2. You will receive your work email credentials                     │
│     3. On your first day, please report to HR Department                │
│                                                                         │
│     ─────────────────────────────────────────────────────────          │
│                                                                         │
│     If you have any questions, please contact:                          │
│     📧 hr@pfigroups.com | 📞 +62 21 1234 5678                           │
│                                                                         │
│     See you on February 1, 2025!                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: HR Reviews & Approves

### Onboarding List View

```
┌────────────────────────────────────────────────────────────────────────────┐
│  HR Dashboard → Onboarding → Pending Review (3)                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ Search: [                    ] │ Status: [▼ All] │ Company: [▼ All] │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ Name         │ Position          │ Start Date │ Status    │ Action  │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │ John Doe     │ Software Engineer │ 2025-02-01 │ 🟡 Review │ [View]  │ │
│  │ Jane Smith   │ Marketing Staff   │ 2025-02-01 │ 🟢 Ready  │ [View]  │ │
│  │ Bob Wilson   │ Accountant        │ 2025-02-15 │ 🔵 Pending│ [View]  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  Status Legend:                                                            │
│  🔵 Pending  - Waiting for employee to complete form                       │
│  🟡 Review   - Employee submitted, awaiting HR review                      │
│  🟢 Ready    - Approved, ready for account provisioning                    │
│  ✓  Complete - Account created, onboarding done                            │
│  ✕  Rejected - Application rejected                                        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### HR Review Detail Page

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Onboarding Review: John Doe                                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  [Photo]     John Doe                                               │  │
│  │              Software Engineer - IT Department                       │  │
│  │              PT PFI Mega Life Insurance                             │  │
│  │              Start Date: February 1, 2025                           │  │
│  │                                                                      │  │
│  │              Status: 🟡 Pending Review                               │  │
│  │              Submitted: January 25, 2025 at 14:30 WIB               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Personal │ │ Address  │ │ Family   │ │ Bank     │ │ Documents│        │
│  │   ✓      │ │   ✓      │ │   ✓      │ │   ✓      │ │   ✓      │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  Personal Information                                        [Edit ✏️]     │
│  ─────────────────────────────────────────────────────────────────────    │
│  NIK: 3171234567890001          │ Place/DOB: Jakarta, 15 May 1990        │
│  Gender: Male                    │ Religion: Islam                        │
│  Marital Status: Married         │ Blood Type: O                          │
│  NPWP: 12.345.678.9-012.000     │ Phone: +62 812 3456 7890               │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  Address Information                                         [Edit ✏️]     │
│  ─────────────────────────────────────────────────────────────────────    │
│  KTP: Jl. Sudirman No. 123, RT 001/RW 002, Karet Semanggi,               │
│       Setiabudi, Jakarta Selatan, DKI Jakarta 12930                       │
│  Domicile: Same as KTP                                                    │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  Emergency Contact                                           [Edit ✏️]     │
│  ─────────────────────────────────────────────────────────────────────    │
│  Name: Jane Doe (Spouse) │ Phone: +62 812 9876 5432                       │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  Bank Details                                                [Edit ✏️]     │
│  ─────────────────────────────────────────────────────────────────────    │
│  Bank: BCA - KCP Sudirman │ Account: 1234567890 │ Name: JOHN DOE          │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  Documents                                                   [View All]    │
│  ─────────────────────────────────────────────────────────────────────    │
│  ✓ KTP          ✓ KK           ✓ Ijazah        ✓ Photo       ✓ Buku Rek  │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  Account Provisioning                                                      │
│  ─────────────────────────────────────────────────────────────────────    │
│  Work Email: john.doe@pfigroups.com                                        │
│  [✓] Create PeopleHub Account                                              │
│  [✓] Create Microsoft 365 Account (Business Basic License)                 │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  HR Notes:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ All documents verified. Ready for account creation.                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│         [Request Revision]      [Reject]      [✓ Approve & Create Account] │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Review Actions

| Action | Description | Next Status |
|--------|-------------|-------------|
| **Approve** | Accept submission, trigger account creation | `approved` → `completed` |
| **Reject** | Reject application with reason | `rejected` |
| **Request Revision** | Ask employee to update/fix data | `revision_required` |

---

## Phase 5: Auto Provisioning

### Provisioning Process

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ACCOUNT PROVISIONING PROCESS                                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Creating accounts for: John Doe                                    │  │
│  │                                                                      │  │
│  │  ════════════════════════════════════════════════════════════════   │  │
│  │                                                                      │  │
│  │  Step 1: Create Employee Record                                     │  │
│  │  ├── Generate Employee ID: PFI-2025-0042                            │  │
│  │  ├── Create employee record in database                             │  │
│  │  └── Status: ✓ Complete                                             │  │
│  │                                                                      │  │
│  │  Step 2: Create PeopleHub User Account                              │  │
│  │  ├── Create user with email: john.doe@pfigroups.com                 │  │
│  │  ├── Assign role: Employee                                          │  │
│  │  ├── Link to employee record                                        │  │
│  │  └── Status: ✓ Complete                                             │  │
│  │                                                                      │  │
│  │  Step 3: Create Microsoft 365 Account                               │  │
│  │  ├── Call Microsoft Graph API                                       │  │
│  │  ├── Create user in Azure AD                                        │  │
│  │  ├── Assign license: Microsoft 365 Business Basic                   │  │
│  │  ├── Set temporary password                                         │  │
│  │  └── Status: ✓ Complete                                             │  │
│  │                                                                      │  │
│  │  Step 4: Send Welcome Email                                         │  │
│  │  ├── Send credentials to: johndoe@gmail.com                         │  │
│  │  ├── Include: PeopleHub login, M365 login, first day instructions   │  │
│  │  └── Status: ✓ Complete                                             │  │
│  │                                                                      │  │
│  │  ════════════════════════════════════════════════════════════════   │  │
│  │                                                                      │  │
│  │  ✓ All accounts created successfully!                               │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Provisioning Implementation

```typescript
async function provisionEmployee(invitationId: number) {
  const invitation = await getInvitationWithSubmission(invitationId);
  const submission = invitation.submission;

  const results = {
    employee: null,
    user: null,
    m365User: null,
    errors: []
  };

  try {
    // Step 1: Create Employee Record
    const employeeId = await generateEmployeeId(invitation.company_id);
    const employee = await prisma.employee.create({
      data: {
        employee_id: employeeId,
        company_id: invitation.company_id,
        department_id: invitation.department_id,
        name: invitation.full_name,
        email: invitation.work_email,
        phone: submission.phone,
        position: invitation.position,
        employment_type: invitation.employment_type,
        employment_status: 'active',
        join_date: invitation.start_date,
        manager_id: invitation.manager_id,

        // Personal info from submission
        nik: submission.nik,
        place_of_birth: submission.place_of_birth,
        date_of_birth: submission.date_of_birth,
        gender: submission.gender,
        religion: submission.religion,
        marital_status: submission.marital_status,
        blood_type: submission.blood_type,
        npwp: submission.npwp,
        bpjs_kesehatan: submission.bpjs_kesehatan,
        bpjs_ketenagakerjaan: submission.bpjs_ketenagakerjaan,

        // Address
        address: submission.ktp_address,
        city: submission.ktp_city,
        province: submission.ktp_province,
        postal_code: submission.ktp_postal_code,

        // Bank details
        bank_name: submission.bank_name,
        bank_account_number: submission.bank_account_number,
        bank_account_name: submission.bank_account_name,

        // Emergency contact
        emergency_contact_name: submission.emergency_name,
        emergency_contact_phone: submission.emergency_phone,
        emergency_contact_relationship: submission.emergency_relationship,

        // Salary
        basic_salary: invitation.basic_salary,

        // Photo
        avatar: submission.photo_path,
      }
    });
    results.employee = employee;

    // Step 2: Create PeopleHub User Account
    const tempPassword = generateTempPassword();
    const user = await prisma.user.create({
      data: {
        email: invitation.work_email,
        password: await hashPassword(tempPassword),
        employee_id: employee.id,
        is_active: true,
        must_change_password: true,
      }
    });

    // Assign Employee role
    await assignRole(user.id, 'Employee');
    results.user = { ...user, tempPassword };

    // Step 3: Create Microsoft 365 Account (if enabled)
    if (invitation.create_m365_account) {
      const m365Password = generateTempPassword();
      const m365User = await createM365Account({
        displayName: invitation.full_name,
        email: invitation.work_email,
        password: m365Password,
        jobTitle: invitation.position,
        department: invitation.department.name,
        companyName: invitation.company.name,
        licenseType: invitation.m365_license_type,
      });
      results.m365User = { ...m365User, tempPassword: m365Password };
    }

    // Step 4: Copy documents to employee folder
    await copyOnboardingDocuments(submission.id, employee.id);

    // Step 5: Create family members
    await createFamilyMembers(submission.id, employee.id);

    // Step 6: Update invitation status
    await prisma.onboardingInvitation.update({
      where: { id: invitationId },
      data: { status: 'completed' }
    });

    // Step 7: Send welcome email
    await sendWelcomeEmail({
      to: invitation.personal_email,
      employee,
      user: results.user,
      m365User: results.m365User,
      company: invitation.company,
    });

    return results;

  } catch (error) {
    results.errors.push(error.message);

    // Rollback if needed
    if (results.employee) {
      await prisma.employee.delete({ where: { id: results.employee.id } });
    }
    if (results.user) {
      await prisma.user.delete({ where: { id: results.user.id } });
    }
    // Note: M365 user deletion requires separate API call

    throw error;
  }
}
```

---

## Phase 6: Welcome Email with Credentials

### Email Template

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL TO: johndoe@gmail.com                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Subject: Your Account Credentials - PT PFI Mega Life Insurance            │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │                    [COMPANY LOGO]                                   │  │
│  │                                                                      │  │
│  │  Dear John Doe,                                                     │  │
│  │                                                                      │  │
│  │  Selamat! Akun Anda telah berhasil dibuat. Berikut adalah          │  │
│  │  informasi login untuk sistem perusahaan:                           │  │
│  │                                                                      │  │
│  │  ══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  📋 EMPLOYEE INFORMATION                                            │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  Employee ID  : PFI-2025-0042                                       │  │
│  │  Position     : Software Engineer                                   │  │
│  │  Department   : IT Department                                       │  │
│  │  Start Date   : February 1, 2025                                    │  │
│  │                                                                      │  │
│  │  ══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  🔐 PEOPLEHUB HRIS LOGIN                                            │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  URL      : https://hr.pfigroups.com                                │  │
│  │  Email    : john.doe@pfigroups.com                                  │  │
│  │  Password : Temp@12345 (wajib diganti saat login pertama)           │  │
│  │                                                                      │  │
│  │  ══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  📧 MICROSOFT 365 LOGIN                                             │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  URL      : https://portal.office.com                               │  │
│  │  Email    : john.doe@pfigroups.com                                  │  │
│  │  Password : M365@67890 (wajib diganti saat login pertama)           │  │
│  │                                                                      │  │
│  │  Dengan akun Microsoft 365, Anda dapat mengakses:                   │  │
│  │  • Outlook (Email perusahaan)                                       │  │
│  │  • Microsoft Teams                                                  │  │
│  │  • OneDrive                                                         │  │
│  │  • Word, Excel, PowerPoint Online                                   │  │
│  │                                                                      │  │
│  │  ══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  📍 FIRST DAY INSTRUCTIONS                                          │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  Tanggal   : Sabtu, 1 Februari 2025                                 │  │
│  │  Waktu     : 08:30 WIB                                              │  │
│  │  Lokasi    : Lobby Lantai 1, Gedung PFI Tower                       │  │
│  │  PIC       : Budi Santoso (HR) - +62 812 0000 1111                  │  │
│  │                                                                      │  │
│  │  Yang perlu dibawa:                                                 │  │
│  │  □ KTP Asli                                                         │  │
│  │  □ NPWP Asli (jika ada)                                             │  │
│  │  □ Ijazah & Transkrip Asli                                          │  │
│  │  □ Buku Rekening Asli                                               │  │
│  │                                                                      │  │
│  │  ══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  ⚠️ PENTING: Jaga kerahasiaan password Anda. Jangan bagikan         │  │
│  │  informasi login kepada siapapun.                                   │  │
│  │                                                                      │  │
│  │  Jika ada pertanyaan, silakan hubungi:                              │  │
│  │  📧 hr@pfigroups.com | 📞 +62 21 1234 5678                          │  │
│  │                                                                      │  │
│  │  Kami tunggu kehadiran Anda!                                        │  │
│  │                                                                      │  │
│  │  Salam hangat,                                                      │  │
│  │  HR Team - PT PFI Mega Life Insurance                               │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────┐       ┌─────────────────────────┐
│  onboarding_invitations │       │  onboarding_submissions │
├─────────────────────────┤       ├─────────────────────────┤
│  id (PK)                │───┐   │  id (PK)                │
│  token (UNIQUE)         │   │   │  invitation_id (FK)     │───┐
│  full_name              │   └──>│  nik                    │   │
│  personal_email         │       │  place_of_birth         │   │
│  phone                  │       │  date_of_birth          │   │
│  company_id (FK)        │       │  gender                 │   │
│  department_id (FK)     │       │  religion               │   │
│  position               │       │  marital_status         │   │
│  employment_type        │       │  ...                    │   │
│  start_date             │       │  submitted_at           │   │
│  manager_id (FK)        │       │  reviewed_by (FK)       │   │
│  basic_salary           │       │  reviewed_at            │   │
│  work_email             │       └─────────────────────────┘   │
│  create_m365_account    │                                     │
│  m365_license_type      │       ┌─────────────────────────┐   │
│  status                 │       │ onboarding_family_members│   │
│  expires_at             │       ├─────────────────────────┤   │
│  created_by (FK)        │       │  id (PK)                │   │
│  created_at             │       │  submission_id (FK)     │<──┤
│  updated_at             │       │  name                   │   │
└─────────────────────────┘       │  relationship           │   │
                                  │  date_of_birth          │   │
                                  │  occupation             │   │
                                  └─────────────────────────┘   │
                                                                │
                                  ┌─────────────────────────┐   │
                                  │  onboarding_documents   │   │
                                  ├─────────────────────────┤   │
                                  │  id (PK)                │   │
                                  │  submission_id (FK)     │<──┘
                                  │  document_type          │
                                  │  file_name              │
                                  │  file_path              │
                                  │  file_size              │
                                  │  mime_type              │
                                  │  uploaded_at            │
                                  └─────────────────────────┘
```

### SQL Schema

```sql
-- =============================================
-- ONBOARDING INVITATIONS
-- =============================================
CREATE TABLE onboarding_invitations (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,

  -- Basic Info (from HR)
  full_name VARCHAR(255) NOT NULL,
  personal_email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),

  -- Employment Details
  company_id INTEGER NOT NULL REFERENCES companies(id),
  department_id INTEGER NOT NULL REFERENCES departments(id),
  position VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) NOT NULL, -- permanent, contract, freelance, internship
  start_date DATE NOT NULL,
  manager_id INTEGER REFERENCES employees(id),

  -- Compensation
  basic_salary DECIMAL(15,2),
  enroll_bpjs_kesehatan BOOLEAN DEFAULT true,
  enroll_bpjs_ketenagakerjaan BOOLEAN DEFAULT true,

  -- Account Settings
  work_email VARCHAR(255) NOT NULL,
  create_m365_account BOOLEAN DEFAULT true,
  m365_license_type VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, submitted, approved, rejected, revision_required, completed, expired, cancelled

  expires_at TIMESTAMP NOT NULL,

  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_invitations_token ON onboarding_invitations(token);
CREATE INDEX idx_onboarding_invitations_status ON onboarding_invitations(status);
CREATE INDEX idx_onboarding_invitations_company ON onboarding_invitations(company_id);

-- =============================================
-- ONBOARDING SUBMISSIONS
-- =============================================
CREATE TABLE onboarding_submissions (
  id SERIAL PRIMARY KEY,
  invitation_id INTEGER NOT NULL REFERENCES onboarding_invitations(id) ON DELETE CASCADE,

  -- Personal Info
  nik VARCHAR(20),
  place_of_birth VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(10), -- male, female
  religion VARCHAR(50),
  marital_status VARCHAR(20), -- single, married, divorced, widowed
  blood_type VARCHAR(5),
  npwp VARCHAR(30),
  bpjs_kesehatan VARCHAR(20),
  bpjs_ketenagakerjaan VARCHAR(20),

  -- Photo
  photo_path VARCHAR(500),

  -- Address - KTP
  ktp_address TEXT,
  ktp_rt VARCHAR(5),
  ktp_rw VARCHAR(5),
  ktp_kelurahan VARCHAR(100),
  ktp_kecamatan VARCHAR(100),
  ktp_city VARCHAR(100),
  ktp_province VARCHAR(100),
  ktp_postal_code VARCHAR(10),

  -- Address - Domicile
  domicile_same_as_ktp BOOLEAN DEFAULT true,
  domicile_address TEXT,
  domicile_rt VARCHAR(5),
  domicile_rw VARCHAR(5),
  domicile_kelurahan VARCHAR(100),
  domicile_kecamatan VARCHAR(100),
  domicile_city VARCHAR(100),
  domicile_province VARCHAR(100),
  domicile_postal_code VARCHAR(10),

  -- Emergency Contact
  emergency_name VARCHAR(255),
  emergency_relationship VARCHAR(50),
  emergency_phone VARCHAR(50),
  emergency_address TEXT,

  -- Bank Details
  bank_name VARCHAR(100),
  bank_branch VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(255),

  -- Form Progress (JSON to track completed steps)
  form_progress JSONB DEFAULT '{}',

  -- Status
  submitted_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  revision_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_submissions_invitation ON onboarding_submissions(invitation_id);

-- =============================================
-- ONBOARDING FAMILY MEMBERS
-- =============================================
CREATE TABLE onboarding_family_members (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES onboarding_submissions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(50) NOT NULL, -- spouse, parent, child, sibling, other
  date_of_birth DATE,
  occupation VARCHAR(100),
  is_dependent BOOLEAN DEFAULT false, -- For BPJS/tax purposes
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_family_submission ON onboarding_family_members(submission_id);

-- =============================================
-- ONBOARDING DOCUMENTS
-- =============================================
CREATE TABLE onboarding_documents (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES onboarding_submissions(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  -- ktp, kk, npwp, ijazah, transkrip, lamaran, cv, photo_3x4, skck, surat_sehat, buku_rekening, other
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_verified BOOLEAN DEFAULT false,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_documents_submission ON onboarding_documents(submission_id);
CREATE INDEX idx_onboarding_documents_type ON onboarding_documents(document_type);

-- =============================================
-- ONBOARDING ACTIVITY LOG
-- =============================================
CREATE TABLE onboarding_activity_logs (
  id SERIAL PRIMARY KEY,
  invitation_id INTEGER NOT NULL REFERENCES onboarding_invitations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  -- created, email_sent, email_resent, form_started, step_completed, submitted,
  -- reviewed, approved, rejected, revision_requested, provisioned, completed
  actor_type VARCHAR(50), -- hr, employee, system
  actor_id INTEGER,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_activity_invitation ON onboarding_activity_logs(invitation_id);
```

### Prisma Schema

```prisma
// schema.prisma

model OnboardingInvitation {
  id                  Int       @id @default(autoincrement())
  token               String    @unique

  // Basic Info
  fullName            String    @map("full_name")
  personalEmail       String    @map("personal_email")
  phone               String?

  // Employment Details
  companyId           Int       @map("company_id")
  departmentId        Int       @map("department_id")
  position            String
  employmentType      String    @map("employment_type")
  startDate           DateTime  @map("start_date") @db.Date
  managerId           Int?      @map("manager_id")

  // Compensation
  basicSalary         Decimal?  @map("basic_salary") @db.Decimal(15, 2)
  enrollBpjsKesehatan Boolean   @default(true) @map("enroll_bpjs_kesehatan")
  enrollBpjsTk        Boolean   @default(true) @map("enroll_bpjs_ketenagakerjaan")

  // Account Settings
  workEmail           String    @map("work_email")
  createM365Account   Boolean   @default(true) @map("create_m365_account")
  m365LicenseType     String?   @map("m365_license_type")

  // Status
  status              String    @default("pending")
  expiresAt           DateTime  @map("expires_at")

  // Metadata
  createdBy           Int?      @map("created_by")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relations
  company             Company   @relation(fields: [companyId], references: [id])
  department          Department @relation(fields: [departmentId], references: [id])
  manager             Employee? @relation("InvitationManager", fields: [managerId], references: [id])
  creator             User?     @relation(fields: [createdBy], references: [id])
  submission          OnboardingSubmission?
  activityLogs        OnboardingActivityLog[]

  @@map("onboarding_invitations")
}

model OnboardingSubmission {
  id                  Int       @id @default(autoincrement())
  invitationId        Int       @unique @map("invitation_id")

  // Personal Info
  nik                 String?
  placeOfBirth        String?   @map("place_of_birth")
  dateOfBirth         DateTime? @map("date_of_birth") @db.Date
  gender              String?
  religion            String?
  maritalStatus       String?   @map("marital_status")
  bloodType           String?   @map("blood_type")
  npwp                String?
  bpjsKesehatan       String?   @map("bpjs_kesehatan")
  bpjsKetenagakerjaan String?   @map("bpjs_ketenagakerjaan")

  // Photo
  photoPath           String?   @map("photo_path")

  // Address - KTP
  ktpAddress          String?   @map("ktp_address")
  ktpRt               String?   @map("ktp_rt")
  ktpRw               String?   @map("ktp_rw")
  ktpKelurahan        String?   @map("ktp_kelurahan")
  ktpKecamatan        String?   @map("ktp_kecamatan")
  ktpCity             String?   @map("ktp_city")
  ktpProvince         String?   @map("ktp_province")
  ktpPostalCode       String?   @map("ktp_postal_code")

  // Address - Domicile
  domicileSameAsKtp   Boolean   @default(true) @map("domicile_same_as_ktp")
  domicileAddress     String?   @map("domicile_address")
  domicileRt          String?   @map("domicile_rt")
  domicileRw          String?   @map("domicile_rw")
  domicileKelurahan   String?   @map("domicile_kelurahan")
  domicileKecamatan   String?   @map("domicile_kecamatan")
  domicileCity        String?   @map("domicile_city")
  domicileProvince    String?   @map("domicile_province")
  domicilePostalCode  String?   @map("domicile_postal_code")

  // Emergency Contact
  emergencyName       String?   @map("emergency_name")
  emergencyRelationship String? @map("emergency_relationship")
  emergencyPhone      String?   @map("emergency_phone")
  emergencyAddress    String?   @map("emergency_address")

  // Bank Details
  bankName            String?   @map("bank_name")
  bankBranch          String?   @map("bank_branch")
  bankAccountNumber   String?   @map("bank_account_number")
  bankAccountName     String?   @map("bank_account_name")

  // Form Progress
  formProgress        Json      @default("{}") @map("form_progress")

  // Status
  submittedAt         DateTime? @map("submitted_at")
  reviewedBy          Int?      @map("reviewed_by")
  reviewedAt          DateTime? @map("reviewed_at")
  reviewNotes         String?   @map("review_notes")
  revisionNotes       String?   @map("revision_notes")

  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relations
  invitation          OnboardingInvitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  reviewer            User?     @relation(fields: [reviewedBy], references: [id])
  familyMembers       OnboardingFamilyMember[]
  documents           OnboardingDocument[]

  @@map("onboarding_submissions")
}

model OnboardingFamilyMember {
  id                  Int       @id @default(autoincrement())
  submissionId        Int       @map("submission_id")
  name                String
  relationship        String
  dateOfBirth         DateTime? @map("date_of_birth") @db.Date
  occupation          String?
  isDependent         Boolean   @default(false) @map("is_dependent")
  createdAt           DateTime  @default(now()) @map("created_at")

  submission          OnboardingSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@map("onboarding_family_members")
}

model OnboardingDocument {
  id                  Int       @id @default(autoincrement())
  submissionId        Int       @map("submission_id")
  documentType        String    @map("document_type")
  fileName            String    @map("file_name")
  filePath            String    @map("file_path")
  fileSize            Int?      @map("file_size")
  mimeType            String?   @map("mime_type")
  isVerified          Boolean   @default(false) @map("is_verified")
  verifiedBy          Int?      @map("verified_by")
  verifiedAt          DateTime? @map("verified_at")
  uploadedAt          DateTime  @default(now()) @map("uploaded_at")

  submission          OnboardingSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  verifier            User?     @relation(fields: [verifiedBy], references: [id])

  @@map("onboarding_documents")
}

model OnboardingActivityLog {
  id                  Int       @id @default(autoincrement())
  invitationId        Int       @map("invitation_id")
  action              String
  actorType           String?   @map("actor_type")
  actorId             Int?      @map("actor_id")
  details             Json?
  ipAddress           String?   @map("ip_address")
  userAgent           String?   @map("user_agent")
  createdAt           DateTime  @default(now()) @map("created_at")

  invitation          OnboardingInvitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)

  @@map("onboarding_activity_logs")
}
```

---

## API Endpoints

### HR Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/onboarding/invitations` | Create new invitation |
| GET | `/api/v1/onboarding/invitations` | List all invitations |
| GET | `/api/v1/onboarding/invitations/:id` | Get invitation detail |
| PUT | `/api/v1/onboarding/invitations/:id` | Update invitation |
| DELETE | `/api/v1/onboarding/invitations/:id` | Cancel invitation |
| POST | `/api/v1/onboarding/invitations/:id/resend` | Resend invitation email |

### Review & Approval Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/onboarding/submissions` | List all submissions |
| GET | `/api/v1/onboarding/submissions/:id` | Get submission detail |
| POST | `/api/v1/onboarding/submissions/:id/approve` | Approve & provision |
| POST | `/api/v1/onboarding/submissions/:id/reject` | Reject submission |
| POST | `/api/v1/onboarding/submissions/:id/revision` | Request revision |

### Public Endpoints (Token-based)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/onboarding/verify/:token` | Verify invitation token |
| GET | `/api/v1/onboarding/form/:token` | Get form data & progress |
| POST | `/api/v1/onboarding/form/:token` | Save form data |
| POST | `/api/v1/onboarding/form/:token/submit` | Submit completed form |
| POST | `/api/v1/onboarding/form/:token/upload` | Upload document |
| DELETE | `/api/v1/onboarding/form/:token/upload/:docId` | Delete uploaded document |

### API Request/Response Examples

#### Create Invitation

```http
POST /api/v1/onboarding/invitations
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "personal_email": "johndoe@gmail.com",
  "phone": "+6281234567890",
  "company_id": 1,
  "department_id": 5,
  "position": "Software Engineer",
  "employment_type": "permanent",
  "start_date": "2025-02-01",
  "manager_id": 10,
  "basic_salary": 15000000,
  "work_email": "john.doe@pfigroups.com",
  "create_m365_account": true,
  "m365_license_type": "MICROSOFT_365_BUSINESS_BASIC",
  "expiry_days": 7
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "token": "abc123xyz...",
    "full_name": "John Doe",
    "personal_email": "johndoe@gmail.com",
    "status": "pending",
    "expires_at": "2025-02-10T23:59:59.000Z",
    "onboarding_url": "https://hr.pfigroups.com/onboarding/complete/abc123xyz...",
    "created_at": "2025-02-03T10:00:00.000Z"
  }
}
```

#### Submit Onboarding Form

```http
POST /api/v1/onboarding/form/abc123xyz.../submit
Content-Type: application/json

{
  "personal_info": {
    "nik": "3171234567890001",
    "place_of_birth": "Jakarta",
    "date_of_birth": "1990-05-15",
    "gender": "male",
    "religion": "islam",
    "marital_status": "married",
    "blood_type": "O",
    "npwp": "12.345.678.9-012.000"
  },
  "address": {
    "ktp": {
      "address": "Jl. Sudirman No. 123",
      "rt": "001",
      "rw": "002",
      "kelurahan": "Karet Semanggi",
      "kecamatan": "Setiabudi",
      "city": "Jakarta Selatan",
      "province": "DKI Jakarta",
      "postal_code": "12930"
    },
    "domicile_same_as_ktp": true
  },
  "emergency_contact": {
    "name": "Jane Doe",
    "relationship": "spouse",
    "phone": "+6281298765432"
  },
  "bank": {
    "bank_name": "BCA",
    "branch": "KCP Sudirman",
    "account_number": "1234567890",
    "account_name": "JOHN DOE"
  },
  "family_members": [
    {
      "name": "Jane Doe",
      "relationship": "spouse",
      "date_of_birth": "1992-03-20",
      "occupation": "Teacher"
    }
  ]
}
```

---

## Frontend Pages

### HR Pages (Authenticated)

| Route | Component | Description |
|-------|-----------|-------------|
| `/onboarding` | OnboardingDashboard | Overview & statistics |
| `/onboarding/invitations` | InvitationList | List all invitations |
| `/onboarding/invitations/create` | CreateInvitation | Create new invitation |
| `/onboarding/invitations/:id` | InvitationDetail | View/edit invitation |
| `/onboarding/review` | ReviewList | List pending reviews |
| `/onboarding/review/:id` | ReviewDetail | Review submission |

### Public Pages (Token-based)

| Route | Component | Description |
|-------|-----------|-------------|
| `/onboarding/complete/:token` | OnboardingForm | Multi-step form |
| `/onboarding/success` | SuccessPage | Submission success |
| `/onboarding/expired` | ExpiredPage | Token expired |

---

## Microsoft 365 Integration

### Prerequisites

1. **Azure AD Tenant** - Organization's Azure Active Directory
2. **App Registration** - Register application in Azure Portal
3. **API Permissions** - Grant required permissions
4. **Admin Consent** - Tenant admin must consent

### Azure AD App Setup

1. Go to Azure Portal → Azure Active Directory → App Registrations
2. Click "New Registration"
3. Configure:
   - Name: `PeopleHub Onboarding`
   - Supported account types: Single tenant
   - Redirect URI: (leave blank for daemon app)

### Required API Permissions

| Permission | Type | Description |
|------------|------|-------------|
| `User.ReadWrite.All` | Application | Create and manage users |
| `Directory.ReadWrite.All` | Application | Manage directory data |
| `Organization.Read.All` | Application | Read organization info |

### Graph API Implementation

```typescript
// src/modules/onboarding/services/m365.service.ts

import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

class M365Service {
  private graphClient: Client;

  constructor() {
    // Initialize Azure credentials
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!
    );

    // Create auth provider
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    // Initialize Graph client
    this.graphClient = Client.initWithMiddleware({ authProvider });
  }

  /**
   * Create user in Azure AD
   */
  async createUser(userData: CreateM365UserDTO): Promise<M365User> {
    const tempPassword = this.generateTempPassword();

    const user = await this.graphClient.api('/users').post({
      accountEnabled: true,
      displayName: userData.displayName,
      mailNickname: userData.email.split('@')[0],
      userPrincipalName: userData.email,
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password: tempPassword
      },
      usageLocation: 'ID', // Indonesia - required for license assignment
      jobTitle: userData.jobTitle,
      department: userData.department,
      companyName: userData.companyName,
      officeLocation: userData.officeLocation,
      mobilePhone: userData.phone,
    });

    return {
      id: user.id,
      email: user.userPrincipalName,
      tempPassword,
    };
  }

  /**
   * Assign license to user
   */
  async assignLicense(userId: string, licenseSkuId: string): Promise<void> {
    await this.graphClient.api(`/users/${userId}/assignLicense`).post({
      addLicenses: [{ skuId: licenseSkuId }],
      removeLicenses: []
    });
  }

  /**
   * Get available licenses
   */
  async getAvailableLicenses(): Promise<License[]> {
    const result = await this.graphClient.api('/subscribedSkus').get();
    return result.value.map((sku: any) => ({
      id: sku.skuId,
      name: sku.skuPartNumber,
      available: sku.prepaidUnits.enabled - sku.consumedUnits,
      total: sku.prepaidUnits.enabled,
    }));
  }

  /**
   * Delete user (for rollback)
   */
  async deleteUser(userId: string): Promise<void> {
    await this.graphClient.api(`/users/${userId}`).delete();
  }

  /**
   * Generate temporary password
   */
  private generateTempPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

export const m365Service = new M365Service();
```

### License SKU IDs (Common)

| License | SKU ID |
|---------|--------|
| Microsoft 365 Business Basic | `3b555118-da6a-4418-894f-7df1e2096870` |
| Microsoft 365 Business Standard | `f245ecc8-75af-4f8e-b61f-27d8114de5f3` |
| Microsoft 365 Business Premium | `cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46` |
| Office 365 E1 | `18181a46-0d4e-45cd-891e-60aabd171b4e` |
| Office 365 E3 | `6fd2c87f-b296-42f0-b197-1e91e994b900` |
| Office 365 E5 | `c7df2760-2c81-4ef7-b578-5b5392b571df` |

### Environment Variables

```env
# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Default M365 License
DEFAULT_M365_LICENSE_SKU=3b555118-da6a-4418-894f-7df1e2096870
```

---

## Email Notification System

### Complete Notification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EMAIL NOTIFICATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. HR Creates Invitation                                                    │
│     └── 📧 Email to: CANDIDATE (invitation link)                            │
│                                                                              │
│  2. Candidate Opens Link                                                     │
│     └── (no email)                                                          │
│                                                                              │
│  3. Candidate Submits Form ⭐                                                │
│     ├── 📧 Email to: CANDIDATE (confirmation - "terima kasih sudah submit") │
│     └── 📧 Email to: HR MANAGER (notification - "ada submission baru")      │
│                                                                              │
│  4. HR Reviews                                                               │
│     ├── If APPROVE:                                                         │
│     │   └── 📧 Email to: CANDIDATE (credentials + first day info)           │
│     ├── If REJECT:                                                          │
│     │   └── 📧 Email to: CANDIDATE (rejection notice)                       │
│     └── If REQUEST REVISION:                                                │
│         └── 📧 Email to: CANDIDATE (revision needed + link)                 │
│                                                                              │
│  5. Reminder Emails (Automated)                                              │
│     ├── 📧 to CANDIDATE: 3 days before expiry (if not submitted)            │
│     └── 📧 to HR: Daily digest of pending reviews                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### HR Notification Email (When Candidate Submits)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL TO: hr.manager@pfigroups.com                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Subject: [Action Required] New Onboarding Submission - John Doe           │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │                    [COMPANY LOGO]                                   │  │
│  │                                                                      │  │
│  │  New Onboarding Submission Received                                 │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  A new employee has completed their onboarding form and is          │  │
│  │  waiting for your review.                                           │  │
│  │                                                                      │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │                                                                      │  │
│  │  👤 Candidate Details                                               │  │
│  │                                                                      │  │
│  │  Name        : John Doe                                             │  │
│  │  Position    : Software Engineer                                    │  │
│  │  Department  : IT Department                                        │  │
│  │  Company     : PT PFI Mega Life Insurance                           │  │
│  │  Start Date  : 1 February 2025                                      │  │
│  │  Submitted   : 25 January 2025, 14:30 WIB                           │  │
│  │                                                                      │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │                                                                      │  │
│  │           ┌─────────────────────────────────────┐                   │  │
│  │           │      REVIEW SUBMISSION      →       │                   │  │
│  │           └─────────────────────────────────────┘                   │  │
│  │                                                                      │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │                                                                      │  │
│  │  📊 Current Pending Reviews: 3                                      │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  This is an automated notification from PeopleHub HRIS.             │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Candidate Confirmation Email (After Submit)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL TO: johndoe@gmail.com                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Subject: Onboarding Form Submitted - PT PFI Mega Life Insurance           │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │                    [COMPANY LOGO]                                   │  │
│  │                                                                      │  │
│  │  Dear John Doe,                                                     │  │
│  │                                                                      │  │
│  │  Terima kasih telah melengkapi formulir onboarding Anda.            │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  📋 Submission Summary                                              │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  Submitted At  : 25 January 2025, 14:30 WIB                         │  │
│  │  Position      : Software Engineer                                  │  │
│  │  Department    : IT Department                                      │  │
│  │  Start Date    : 1 February 2025                                    │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  ⏳ What's Next?                                                    │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  1. Tim HR akan mereview data yang Anda submit                      │  │
│  │  2. Anda akan menerima email berisi kredensial login                │  │
│  │  3. Pada hari pertama kerja, silakan lapor ke HR Department         │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  Jika ada pertanyaan, silakan hubungi:                              │  │
│  │  📧 hr@pfigroups.com | 📞 +62 21 1234 5678                          │  │
│  │                                                                      │  │
│  │  Salam hangat,                                                      │  │
│  │  HR Team - PT PFI Mega Life Insurance                               │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Daily Digest Email (For HR Managers)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL TO: hr.manager@pfigroups.com                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Subject: [Daily Digest] Onboarding Status - 25 January 2025               │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  📊 ONBOARDING DAILY DIGEST                                         │  │
│  │  25 January 2025                                                    │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │  🟡 PENDING REVIEW (3)                                              │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  • John Doe - Software Engineer (submitted 2 days ago)              │  │
│  │  • Jane Smith - Marketing Staff (submitted 1 day ago)               │  │
│  │  • Bob Wilson - Accountant (submitted today)                        │  │
│  │                                                                      │  │
│  │  🔵 WAITING FOR CANDIDATE (2)                                       │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  • Alice Brown - HR Staff (expires in 5 days)                       │  │
│  │  • Charlie Lee - Designer (expires in 2 days) ⚠️                    │  │
│  │                                                                      │  │
│  │  🟠 REVISION REQUESTED (1)                                          │  │
│  │  ─────────────────────────────────────────────────────────          │  │
│  │  • David Kim - Sales Rep (waiting 3 days)                           │  │
│  │                                                                      │  │
│  │  ═══════════════════════════════════════════════════════════════    │  │
│  │                                                                      │  │
│  │           ┌─────────────────────────────────────┐                   │  │
│  │           │      VIEW ALL ONBOARDING     →      │                   │  │
│  │           └─────────────────────────────────────┘                   │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Email Recipients Configuration

```typescript
// Notification Settings per Company
interface OnboardingNotificationSettings {
  // When candidate submits
  on_submission: {
    notify_creator: boolean;      // HR yang buat invitation
    notify_hr_managers: boolean;  // Semua HR Manager di company
    notify_custom_emails: string[];  // Custom email list
  };

  // When HR takes action (approve/reject/revision)
  on_hr_action: {
    notify_candidate: boolean;    // Always true
    cc_creator: boolean;          // CC HR yang buat invitation
  };

  // Daily digest
  daily_digest: {
    enabled: boolean;
    send_time: string;            // "09:00" (WIB)
    recipients: string[];         // HR Manager emails
    include_summary: boolean;     // Include statistics
  };

  // Reminders
  reminders: {
    candidate_before_expiry_days: number;  // Default: 3
    hr_pending_review_days: number;        // Default: 2
  };
}
```

### Default Notification Recipients

| Event | Recipients | Email Template |
|-------|------------|----------------|
| HR Creates Invitation | Candidate | `onboarding-invitation` |
| 3 days before expiry | Candidate | `onboarding-reminder` |
| Candidate Submits | Candidate | `onboarding-submitted-candidate` |
| Candidate Submits | HR Creator + HR Managers | `onboarding-submitted-hr` |
| HR Requests Revision | Candidate | `onboarding-revision` |
| HR Approves | Candidate | `onboarding-approved` |
| HR Rejects | Candidate | `onboarding-rejected` |
| Accounts Created | Candidate | `onboarding-credentials` |
| Daily (if pending > 0) | HR Managers | `onboarding-daily-digest` |

### Email Service Implementation

```typescript
// src/modules/onboarding/services/onboarding-email.service.ts

class OnboardingEmailService {

  /**
   * Send notification to HR when candidate submits
   */
  async notifyHROnSubmission(submission: OnboardingSubmission): Promise<void> {
    const invitation = submission.invitation;
    const company = invitation.company;
    const settings = await this.getNotificationSettings(company.id);

    const recipients: string[] = [];

    // Add invitation creator
    if (settings.on_submission.notify_creator && invitation.creator) {
      recipients.push(invitation.creator.email);
    }

    // Add all HR Managers in company
    if (settings.on_submission.notify_hr_managers) {
      const hrManagers = await this.getHRManagers(company.id);
      recipients.push(...hrManagers.map(hr => hr.email));
    }

    // Add custom emails
    if (settings.on_submission.notify_custom_emails?.length) {
      recipients.push(...settings.on_submission.notify_custom_emails);
    }

    // Remove duplicates
    const uniqueRecipients = [...new Set(recipients)];

    // Get pending count for context
    const pendingCount = await this.getPendingReviewCount(company.id);

    // Send email to each recipient
    for (const email of uniqueRecipients) {
      await this.emailService.send({
        to: email,
        subject: `[Action Required] New Onboarding Submission - ${invitation.full_name}`,
        template: 'onboarding-submitted-hr',
        data: {
          candidate_name: invitation.full_name,
          position: invitation.position,
          department: invitation.department.name,
          company_name: company.name,
          company_logo: company.logo_url,
          start_date: formatDate(invitation.start_date),
          submitted_at: formatDateTime(submission.submitted_at),
          review_url: `${process.env.FRONTEND_URL}/onboarding/review/${submission.id}`,
          pending_count: pendingCount,
        }
      });
    }

    // Log activity
    await this.logActivity(invitation.id, 'hr_notified', {
      recipients: uniqueRecipients,
      submission_id: submission.id,
    });
  }

  /**
   * Send confirmation to candidate after submission
   */
  async notifyCandidateOnSubmission(submission: OnboardingSubmission): Promise<void> {
    const invitation = submission.invitation;
    const company = invitation.company;

    await this.emailService.send({
      to: invitation.personal_email,
      subject: `Onboarding Form Submitted - ${company.name}`,
      template: 'onboarding-submitted-candidate',
      data: {
        candidate_name: invitation.full_name,
        position: invitation.position,
        department: invitation.department.name,
        company_name: company.name,
        company_logo: company.logo_url,
        start_date: formatDate(invitation.start_date),
        submitted_at: formatDateTime(submission.submitted_at),
        hr_email: company.hr_email,
        hr_phone: company.hr_phone,
      }
    });

    await this.logActivity(invitation.id, 'candidate_notified_submission', {
      email: invitation.personal_email,
    });
  }

  /**
   * Send daily digest to HR Managers
   */
  async sendDailyDigest(companyId: number): Promise<void> {
    const settings = await this.getNotificationSettings(companyId);

    if (!settings.daily_digest.enabled) return;

    const [pendingReview, waitingCandidate, revisionRequested] = await Promise.all([
      this.getSubmissionsByStatus(companyId, 'submitted'),
      this.getSubmissionsByStatus(companyId, 'pending'),
      this.getSubmissionsByStatus(companyId, 'revision_required'),
    ]);

    // Skip if nothing to report
    if (pendingReview.length === 0 && waitingCandidate.length === 0 && revisionRequested.length === 0) {
      return;
    }

    const company = await this.getCompany(companyId);

    for (const email of settings.daily_digest.recipients) {
      await this.emailService.send({
        to: email,
        subject: `[Daily Digest] Onboarding Status - ${formatDate(new Date())}`,
        template: 'onboarding-daily-digest',
        data: {
          date: formatDate(new Date()),
          company_name: company.name,
          company_logo: company.logo_url,
          pending_review: pendingReview,
          waiting_candidate: waitingCandidate,
          revision_requested: revisionRequested,
          dashboard_url: `${process.env.FRONTEND_URL}/onboarding`,
        }
      });
    }
  }

  /**
   * Send reminder to candidate before invitation expires
   */
  async sendExpiryReminder(invitation: OnboardingInvitation): Promise<void> {
    const daysUntilExpiry = differenceInDays(invitation.expires_at, new Date());

    await this.emailService.send({
      to: invitation.personal_email,
      subject: `Reminder: Complete Your Onboarding - Expires in ${daysUntilExpiry} days`,
      template: 'onboarding-reminder',
      data: {
        candidate_name: invitation.full_name,
        company_name: invitation.company.name,
        company_logo: invitation.company.logo_url,
        position: invitation.position,
        days_until_expiry: daysUntilExpiry,
        expiry_date: formatDateTime(invitation.expires_at),
        onboarding_url: `${process.env.FRONTEND_URL}/onboarding/complete/${invitation.token}`,
        hr_email: invitation.company.hr_email,
        hr_phone: invitation.company.hr_phone,
      }
    });

    await this.logActivity(invitation.id, 'reminder_sent', {
      days_until_expiry: daysUntilExpiry,
    });
  }
}

export const onboardingEmailService = new OnboardingEmailService();
```

### Cron Jobs for Automated Emails

```typescript
// src/jobs/onboarding-notifications.job.ts

import cron from 'node-cron';
import { onboardingEmailService } from '../modules/onboarding/services/onboarding-email.service';

// Send daily digest every day at 9:00 AM WIB (2:00 AM UTC)
cron.schedule('0 2 * * *', async () => {
  console.log('Running onboarding daily digest job...');

  const companies = await prisma.company.findMany({
    where: { is_active: true }
  });

  for (const company of companies) {
    try {
      await onboardingEmailService.sendDailyDigest(company.id);
    } catch (error) {
      console.error(`Failed to send digest for company ${company.id}:`, error);
    }
  }
});

// Check for expiring invitations every day at 8:00 AM WIB (1:00 AM UTC)
cron.schedule('0 1 * * *', async () => {
  console.log('Running expiry reminder job...');

  const reminderDays = 3; // Send reminder 3 days before expiry
  const targetDate = addDays(new Date(), reminderDays);

  const expiringInvitations = await prisma.onboardingInvitation.findMany({
    where: {
      status: 'pending',
      expires_at: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
    },
    include: {
      company: true,
    },
  });

  for (const invitation of expiringInvitations) {
    try {
      await onboardingEmailService.sendExpiryReminder(invitation);
    } catch (error) {
      console.error(`Failed to send reminder for invitation ${invitation.id}:`, error);
    }
  }
});
```

### Database Schema for Notification Settings

```sql
-- Add to existing schema
CREATE TABLE onboarding_notification_settings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- On submission
  notify_creator BOOLEAN DEFAULT true,
  notify_hr_managers BOOLEAN DEFAULT true,
  notify_custom_emails TEXT[], -- Array of emails

  -- Daily digest
  daily_digest_enabled BOOLEAN DEFAULT true,
  daily_digest_time TIME DEFAULT '09:00:00',
  daily_digest_recipients TEXT[],

  -- Reminders
  candidate_reminder_days INTEGER DEFAULT 3,
  hr_pending_reminder_days INTEGER DEFAULT 2,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(company_id)
);
```

---

## Data Mapping (Onboarding → Employee)

When HR approves an onboarding submission, data is automatically mapped to create the employee record.

### Mapping Table

| Source (Onboarding) | Target (Employee) | Notes |
|---------------------|-------------------|-------|
| **From Invitation** | | |
| `full_name` | `name` | |
| `work_email` | `email` | |
| `phone` | `phone` | Can be overwritten by submission |
| `company_id` | `company_id` | |
| `department_id` | `department_id` | |
| `position` | `position` | |
| `employment_type` | `employment_type` | |
| `start_date` | `join_date` | |
| `manager_id` | `manager_id` | |
| `basic_salary` | `basic_salary` | |
| **From Submission** | | |
| `nik` | `nik` | |
| `place_of_birth` | `place_of_birth` | |
| `date_of_birth` | `date_of_birth` | |
| `gender` | `gender` | |
| `religion` | `religion` | |
| `marital_status` | `marital_status` | |
| `blood_type` | `blood_type` | |
| `npwp` | `npwp` | |
| `bpjs_kesehatan` | `bpjs_kesehatan` | |
| `bpjs_ketenagakerjaan` | `bpjs_ketenagakerjaan` | |
| `photo_path` | `avatar` | Copied to employee folder |
| `ktp_address` | `address` | |
| `ktp_city` | `city` | |
| `ktp_province` | `province` | |
| `ktp_postal_code` | `postal_code` | |
| `bank_name` | `bank_name` | |
| `bank_branch` | `bank_branch` | |
| `bank_account_number` | `bank_account_number` | |
| `bank_account_name` | `bank_account_name` | |
| `emergency_name` | `emergency_contact_name` | |
| `emergency_phone` | `emergency_contact_phone` | |
| `emergency_relationship` | `emergency_contact_relationship` | |
| **Auto Generated** | | |
| - | `employee_id` | Generated: `{PREFIX}-{YEAR}-{SEQ}` |
| - | `employment_status` | Set to `active` |
| - | `created_at` | Current timestamp |

### Mapping Implementation

```typescript
// src/modules/onboarding/services/onboarding-provisioning.service.ts

async function mapSubmissionToEmployee(
  invitation: OnboardingInvitation,
  submission: OnboardingSubmission
): Promise<Prisma.EmployeeCreateInput> {

  // Generate employee ID
  const employeeId = await generateEmployeeId(invitation.company_id);

  return {
    // From Invitation
    employee_id: employeeId,
    company_id: invitation.company_id,
    department_id: invitation.department_id,
    name: invitation.full_name,
    email: invitation.work_email,
    phone: submission.phone || invitation.phone,
    position: invitation.position,
    employment_type: invitation.employment_type,
    employment_status: 'active',
    join_date: invitation.start_date,
    manager_id: invitation.manager_id,
    basic_salary: invitation.basic_salary,

    // From Submission - Personal
    nik: submission.nik,
    place_of_birth: submission.place_of_birth,
    date_of_birth: submission.date_of_birth,
    gender: submission.gender,
    religion: submission.religion,
    marital_status: submission.marital_status,
    blood_type: submission.blood_type,
    npwp: submission.npwp,
    bpjs_kesehatan: submission.bpjs_kesehatan,
    bpjs_ketenagakerjaan: submission.bpjs_ketenagakerjaan,

    // From Submission - Photo
    avatar: submission.photo_path,

    // From Submission - Address (KTP)
    address: submission.ktp_address,
    city: submission.ktp_city,
    province: submission.ktp_province,
    postal_code: submission.ktp_postal_code,

    // From Submission - Bank
    bank_name: submission.bank_name,
    bank_branch: submission.bank_branch,
    bank_account_number: submission.bank_account_number,
    bank_account_name: submission.bank_account_name,

    // From Submission - Emergency Contact
    emergency_contact_name: submission.emergency_name,
    emergency_contact_phone: submission.emergency_phone,
    emergency_contact_relationship: submission.emergency_relationship,
  };
}

/**
 * Generate employee ID with format: {PREFIX}-{YEAR}-{SEQUENCE}
 * Example: PFI-2025-0042
 */
async function generateEmployeeId(companyId: number): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { code: true }
  });

  const prefix = company?.code || 'EMP';
  const year = new Date().getFullYear();

  // Get last sequence for this company and year
  const lastEmployee = await prisma.employee.findFirst({
    where: {
      company_id: companyId,
      employee_id: { startsWith: `${prefix}-${year}-` }
    },
    orderBy: { employee_id: 'desc' },
    select: { employee_id: true }
  });

  let sequence = 1;
  if (lastEmployee) {
    const parts = lastEmployee.employee_id.split('-');
    sequence = parseInt(parts[2]) + 1;
  }

  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}
```

### Documents Mapping

Documents uploaded during onboarding are copied to the employee's document folder:

```typescript
async function copyOnboardingDocuments(
  submissionId: number,
  employeeId: number
): Promise<void> {
  const documents = await prisma.onboardingDocument.findMany({
    where: { submission_id: submissionId }
  });

  for (const doc of documents) {
    // Copy file to employee folder
    const newPath = await copyFileToEmployeeFolder(
      doc.file_path,
      employeeId,
      doc.document_type
    );

    // Create employee document record
    await prisma.employeeDocument.create({
      data: {
        employee_id: employeeId,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_path: newPath,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        uploaded_at: doc.uploaded_at,
        source: 'onboarding',
        source_id: doc.id,
      }
    });
  }
}
```

### Family Members Mapping

```typescript
async function createFamilyMembers(
  submissionId: number,
  employeeId: number
): Promise<void> {
  const familyMembers = await prisma.onboardingFamilyMember.findMany({
    where: { submission_id: submissionId }
  });

  for (const member of familyMembers) {
    await prisma.employeeFamilyMember.create({
      data: {
        employee_id: employeeId,
        name: member.name,
        relationship: member.relationship,
        date_of_birth: member.date_of_birth,
        occupation: member.occupation,
        is_dependent: member.is_dependent,
      }
    });
  }
}
```

---

## Implementation Phases

### Phase 1: Basic Invitation System (Week 1-2)

**Backend:**
- [ ] Database schema & migrations
- [ ] Invitation CRUD APIs
- [ ] Token generation & validation
- [ ] Basic email service integration

**Frontend:**
- [ ] Invitation list page
- [ ] Create invitation form
- [ ] Invitation detail page

### Phase 2: Public Onboarding Form (Week 3-4)

**Backend:**
- [ ] Public form APIs (token-based)
- [ ] File upload handling
- [ ] Form validation
- [ ] Progress tracking

**Frontend:**
- [ ] Multi-step form component
- [ ] Each step form (Personal, Address, Family, Bank, Documents)
- [ ] Document upload component
- [ ] Success/Error pages

### Phase 3: Review & Approval (Week 5)

**Backend:**
- [ ] Review APIs
- [ ] Approval workflow
- [ ] Revision request handling

**Frontend:**
- [ ] Submission review list
- [ ] Review detail page
- [ ] Approve/Reject/Revision actions

### Phase 4: Account Provisioning (Week 6)

**Backend:**
- [ ] Employee creation from submission
- [ ] User account creation
- [ ] Document migration
- [ ] Welcome email with credentials

**Frontend:**
- [ ] Provisioning status display
- [ ] Activity logs

### Phase 5: Microsoft 365 Integration (Week 7-8)

**Backend:**
- [ ] Azure AD app registration
- [ ] Graph API integration
- [ ] User creation in Azure AD
- [ ] License assignment
- [ ] Error handling & rollback

**Frontend:**
- [ ] M365 options in invitation form
- [ ] License selection
- [ ] M365 status display

### Phase 6: Testing & Polish (Week 9-10)

- [ ] End-to-end testing
- [ ] Email template refinement
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Documentation

---

## Security Considerations

### Token Security

- Use cryptographically secure random tokens (UUID v4 + hash)
- Set reasonable expiry times (default: 7 days)
- One-time token validation for sensitive actions
- Rate limiting on public endpoints

### Data Protection

- Encrypt sensitive data at rest (bank details, NPWP)
- HTTPS only for all endpoints
- Secure file upload with virus scanning
- Access control for document viewing

### Audit Trail

- Log all actions with timestamps
- Track IP addresses and user agents
- Maintain history of status changes
- GDPR/data retention compliance

---

## Appendix

### Email Templates Required

1. `onboarding-invitation` - Initial invitation email
2. `onboarding-reminder` - Reminder before expiry
3. `onboarding-submitted` - Confirmation of submission
4. `onboarding-revision` - Revision requested
5. `onboarding-approved` - Approval notification
6. `onboarding-rejected` - Rejection notification
7. `onboarding-credentials` - Welcome email with credentials

### Status Definitions

| Status | Description |
|--------|-------------|
| `draft` | Invitation created but not sent |
| `pending` | Invitation sent, waiting for employee |
| `in_progress` | Employee started filling form |
| `submitted` | Employee completed and submitted |
| `under_review` | HR is reviewing submission |
| `revision_required` | HR requested changes |
| `approved` | HR approved, ready for provisioning |
| `provisioning` | Account creation in progress |
| `completed` | All accounts created |
| `rejected` | Application rejected |
| `expired` | Invitation expired |
| `cancelled` | Invitation cancelled by HR |

---

*Document last updated: February 2026*
