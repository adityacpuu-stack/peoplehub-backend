import { Prisma } from '@prisma/client';

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  role_id?: number;
  company_id?: number;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  employee_id?: number;
  role_ids?: number[];
  is_active?: boolean;
}

export interface UpdateUserDTO {
  email?: string;
  password?: string;
  is_active?: boolean;
  role_ids?: number[];
}

export const USER_LIST_SELECT = {
  id: true,
  email: true,
  is_active: true,
  email_verified_at: true,
  last_login_at: true,
  last_login_ip: true,
  created_at: true,
  updated_at: true,
  employee: {
    select: {
      id: true,
      employee_id: true,
      name: true,
      email: true,
      personal_email: true,
      company: {
        select: {
          id: true,
          name: true,
          code: true,
          email_domain: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  userRoles: {
    select: {
      role: {
        select: {
          id: true,
          name: true,
          level: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export const USER_DETAIL_SELECT = {
  ...USER_LIST_SELECT,
  two_factor_enabled: true,
  failed_login_attempts: true,
  account_locked_until: true,
  password_expires_at: true,
  force_password_change: true,
  last_password_change: true,
  language: true,
  timezone: true,
  theme: true,
  userPermissions: {
    select: {
      permission: {
        select: {
          id: true,
          name: true,
          group: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;
