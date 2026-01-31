import { Prisma } from '@prisma/client';

// ==========================================
// QUERY TYPES
// ==========================================

export interface FormTemplateListQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  category?: string;
  is_active?: boolean;
}

// ==========================================
// DTO TYPES
// ==========================================

export interface CreateFormTemplateDTO {
  name: string;
  code?: string;
  description?: string;
  content?: string;
  type?: string;
  category?: string;
  variables?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateFormTemplateDTO {
  name?: string;
  code?: string;
  description?: string;
  content?: string;
  type?: string;
  category?: string;
  variables?: Record<string, any>;
  is_active?: boolean;
}

export interface RenderTemplateDTO {
  data: Record<string, any>;
}

// ==========================================
// ENUMS
// ==========================================

export const TEMPLATE_TYPES = [
  'policy',
  'form',
  'letter',
  'certificate',
  'contract',
  'memo',
  'announcement',
] as const;

export const TEMPLATE_CATEGORIES = [
  'hr',
  'finance',
  'operations',
  'legal',
  'general',
] as const;

// ==========================================
// SELECT TYPES
// ==========================================

export const FORM_TEMPLATE_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  type: true,
  category: true,
  is_active: true,
  version: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.FormTemplateSelect;

export const FORM_TEMPLATE_DETAIL_SELECT = {
  ...FORM_TEMPLATE_SELECT,
  content: true,
  variables: true,
} satisfies Prisma.FormTemplateSelect;

// ==========================================
// DEFAULT TEMPLATES
// ==========================================

export const DEFAULT_FORM_TEMPLATES = [
  {
    name: 'Offer Letter',
    code: 'OFFER_LETTER',
    type: 'letter',
    category: 'hr',
    description: 'Standard offer letter template',
    variables: {
      employee_name: 'string',
      position: 'string',
      department: 'string',
      salary: 'number',
      start_date: 'date',
      company_name: 'string',
    },
    content: `
Dear {{employee_name}},

We are pleased to offer you the position of {{position}} in the {{department}} department at {{company_name}}.

Your starting salary will be {{salary}} per month, effective from {{start_date}}.

Please confirm your acceptance of this offer by signing and returning this letter.

Best regards,
HR Department
{{company_name}}
    `.trim(),
  },
  {
    name: 'Warning Letter',
    code: 'WARNING_LETTER',
    type: 'letter',
    category: 'hr',
    description: 'Employee warning letter template',
    variables: {
      employee_name: 'string',
      employee_id: 'string',
      violation: 'string',
      date_of_incident: 'date',
      warning_level: 'string',
    },
    content: `
EMPLOYEE WARNING LETTER

To: {{employee_name}} ({{employee_id}})
Date: {{current_date}}
Warning Level: {{warning_level}}

This letter serves as a formal warning regarding the following violation:

{{violation}}

Date of incident: {{date_of_incident}}

Please be advised that further violations may result in more severe disciplinary action.

HR Department
    `.trim(),
  },
  {
    name: 'Leave Application Form',
    code: 'LEAVE_FORM',
    type: 'form',
    category: 'hr',
    description: 'Employee leave application form',
    variables: {
      employee_name: 'string',
      employee_id: 'string',
      leave_type: 'string',
      start_date: 'date',
      end_date: 'date',
      reason: 'string',
    },
    content: `
LEAVE APPLICATION FORM

Employee Name: {{employee_name}}
Employee ID: {{employee_id}}
Leave Type: {{leave_type}}
Start Date: {{start_date}}
End Date: {{end_date}}

Reason for Leave:
{{reason}}

Employee Signature: _________________ Date: _______
Manager Approval: _________________ Date: _______
HR Approval: _________________ Date: _______
    `.trim(),
  },
];
