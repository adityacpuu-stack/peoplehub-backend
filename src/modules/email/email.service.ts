import nodemailer, { Transporter } from 'nodemailer';
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
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initTransporter(): void {
    const { host, port, secure, user, password } = config.email;

    // Check if SMTP is configured
    if (!host || !user || !password) {
      console.warn('Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env');
      this.isConfigured = false;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });

    this.isConfigured = true;
    console.log('Email service initialized successfully');
  }

  /**
   * Check if email service is configured
   */
  public isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Verify SMTP connection
   */
  public async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('SMTP connection verified');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }

  /**
   * Send email
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter || !this.isConfigured) {
      console.warn('Email not sent: SMTP not configured');
      return false;
    }

    try {
      const { to, subject, html, text, attachments } = options;

      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.htmlToText(html),
        attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
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
      subject: `Selamat Datang di ${config.app.name}!`,
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
      subject: `Pengajuan Cuti Baru dari ${data.employeeName}`,
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
    const statusText = data.status === 'approved' ? 'Disetujui' : 'Ditolak';
    return this.sendEmail({
      to,
      subject: `Pengajuan Cuti ${statusText} - ${config.app.name}`,
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
      subject: `Pengingat: ${data.pendingCount} Pengajuan Cuti Menunggu`,
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
