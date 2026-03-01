import { Resend } from 'resend';
import { config } from '../../config/env';
import {
  EmailOptions,
  WelcomeEmailData,
  ResetPasswordEmailData,
  LeaveRequestEmailData,
  LeaveApprovalEmailData,
  LeaveReminderEmailData,
} from './email.types';
import {
  welcomeEmailTemplate,
  resetPasswordEmailTemplate,
  leaveRequestEmailTemplate,
  leaveApprovalEmailTemplate,
  leaveReminderEmailTemplate,
} from './email.templates';

class EmailService {
  private resend: Resend | null = null;
  private isConfigured: boolean = false;
  private fromEmail: string = 'noreply@pathfinder.co.id';

  constructor() {
    this.init();
  }

  /**
   * Initialize Resend client
   */
  private init(): void {
    const apiKey = process.env.RESEND_API_KEY;

    console.log('[EMAIL] Initializing Resend...', { apiKey: apiKey ? '***' : 'NOT SET' });

    if (!apiKey) {
      console.warn('[EMAIL] Not configured. Set RESEND_API_KEY environment variable');
      this.isConfigured = false;
      return;
    }

    this.resend = new Resend(apiKey);
    this.isConfigured = true;

    console.log('[EMAIL] Resend initialized successfully with from:', this.fromEmail);
  }

  /**
   * Check if email service is configured
   */
  public isReady(): boolean {
    return this.isConfigured && this.resend !== null;
  }

  /**
   * Send email via Resend
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log('[EMAIL] Attempting to send to:', options.to, '| Subject:', options.subject);

    if (!this.resend || !this.isConfigured) {
      console.warn('[EMAIL] SKIPPED - Resend not configured');
      return false;
    }

    try {
      const { to, subject, html, text } = options;
      const toAddresses = Array.isArray(to) ? to : [to];

      const fromName = config.email.fromName || 'PeopleHub';

      const { data, error } = await this.resend.emails.send({
        from: `${fromName} <${this.fromEmail}>`,
        to: toAddresses,
        subject,
        html,
        text: text || this.htmlToText(html),
      });

      if (error) {
        console.error('[EMAIL] FAILED -', error.message);
        return false;
      }

      console.log(`[EMAIL] SUCCESS - Sent to ${to}: ${data?.id}`);
      return true;
    } catch (error: any) {
      console.error('[EMAIL] FAILED -', error.message || error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  public async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Welcome to ${config.app.name}!`,
      html: welcomeEmailTemplate(data),
    });
  }

  /**
   * Send password reset email
   */
  public async sendResetPasswordEmail(
    to: string,
    data: ResetPasswordEmailData
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Reset Password - ${config.app.name}`,
      html: resetPasswordEmailTemplate(data),
    });
  }

  /**
   * Send leave request notification to approver
   */
  public async sendLeaveRequestEmail(
    to: string,
    data: LeaveRequestEmailData
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `New Leave Request from ${data.employeeName}`,
      html: leaveRequestEmailTemplate(data),
    });
  }

  /**
   * Send leave approval/rejection notification to employee
   */
  public async sendLeaveApprovalEmail(
    to: string,
    data: LeaveApprovalEmailData
  ): Promise<boolean> {
    const statusText = data.status === 'approved' ? 'Approved' : 'Rejected';
    return this.sendEmail({
      to,
      subject: `Leave Request ${statusText} - ${config.app.name}`,
      html: leaveApprovalEmailTemplate(data),
    });
  }

  /**
   * Send leave reminder to approver
   */
  public async sendLeaveReminderEmail(
    to: string,
    data: LeaveReminderEmailData
  ): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Reminder: ${data.pendingCount} Pending Leave Request(s)`,
      html: leaveReminderEmailTemplate(data),
    });
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Export singleton instance
export const emailService = new EmailService();
