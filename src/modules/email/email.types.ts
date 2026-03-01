// Email Types

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

// Template Data Types
export interface WelcomeEmailData {
  name: string;
  email: string;
  temporaryPassword?: string;
  loginUrl: string;
  isNewM365Account?: boolean;
  outlookUrl?: string;
}

export interface ResetPasswordEmailData {
  name: string;
  resetUrl: string;
  expiresIn: string;
}

export interface LeaveRequestEmailData {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  approverName: string;
  approvalUrl: string;
}

export interface LeaveApprovalEmailData {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'approved' | 'rejected';
  approverName: string;
  rejectionReason?: string;
}

export interface LeaveReminderEmailData {
  approverName: string;
  pendingCount: number;
  approvalUrl: string;
}

export type EmailTemplateType =
  | 'welcome'
  | 'reset-password'
  | 'leave-request'
  | 'leave-approval'
  | 'leave-reminder';
