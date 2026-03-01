import { config } from '../../config/env';
import {
  WelcomeEmailData,
  ResetPasswordEmailData,
  LeaveRequestEmailData,
  LeaveApprovalEmailData,
  LeaveReminderEmailData,
} from './email.types';

const appName = config.app.name;
const primaryColor = '#334155'; // slate-700
const logoUrl = 'https://peoplehub.pfigroups.com/images/logo/logo.png';

// Base template wrapper
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #1e293b 100%); padding: 24px 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <img src="${logoUrl}" alt="${appName}" style="height: 80px; width: auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Button component
function button(text: string, url: string, color: string = primaryColor): string {
  return `
    <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      ${text}
    </a>
  `;
}

// Credential box component
function credentialBox(icon: string, title: string, rows: { label: string; value: string; mono?: boolean }[]): string {
  return `
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 16px; border-left: 4px solid ${primaryColor};">
      <p style="margin: 0 0 12px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${icon} ${title}</p>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        ${rows.map(r => `
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px; width: 100px;">${r.label}</td>
          <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-weight: 600;${r.mono ? ' font-family: monospace;' : ''}">${r.value}</td>
        </tr>
        `).join('')}
      </table>
    </div>
  `;
}

// Employee info section
function employeeInfoSection(data: WelcomeEmailData): string {
  const rows: { label: string; value: string }[] = [];
  if (data.employeeId) rows.push({ label: 'Employee ID', value: data.employeeId });
  if (data.position) rows.push({ label: 'Position', value: data.position });
  if (data.department) rows.push({ label: 'Department', value: data.department });
  if (data.company) rows.push({ label: 'Company', value: data.company });
  if (data.startDate) rows.push({ label: 'Start Date', value: data.startDate });

  if (rows.length === 0) return '';

  return credentialBox('📋', 'Employee Information', rows);
}

// Welcome Email Template
export function welcomeEmailTemplate(data: WelcomeEmailData): string {
  const outlookUrl = data.outlookUrl || 'https://outlook.office.com';

  // New M365 account: show employee info + separate PeopleHub & M365 credentials
  if (data.isNewM365Account) {
    const content = `
      <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Welcome, ${data.name}!</h2>
      <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
        Your office email and ${appName} account have been created. Below are your details.
      </p>

      <!-- Employee Info -->
      ${employeeInfoSection(data)}

      <!-- PeopleHub Credential -->
      ${credentialBox('🔐', `${appName} HRIS Login`, [
        { label: 'URL', value: `<a href="${data.loginUrl}" style="color: #2563eb; text-decoration: none;">${data.loginUrl}</a>` },
        { label: 'Email', value: data.email },
        ...(data.temporaryPassword ? [{ label: 'Password', value: data.temporaryPassword, mono: true }] : []),
      ])}

      <!-- M365 Credential -->
      ${credentialBox('📧', 'Microsoft 365 Login', [
        { label: 'URL', value: `<a href="${outlookUrl}" style="color: #2563eb; text-decoration: none;">${outlookUrl}</a>` },
        { label: 'Email', value: data.email },
        ...(data.m365Password ? [{ label: 'Password', value: data.m365Password, mono: true }] : []),
      ])}

      <!-- Warning -->
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          <strong>⚠️ Important:</strong> You must change both passwords on first login. PeopleHub and Microsoft 365 have <strong>separate passwords</strong>.
        </p>
      </div>

      <!-- Buttons -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="text-align: center; padding: 0 4px;">
            ${button('Login PeopleHub', data.loginUrl)}
          </td>
          <td style="text-align: center; padding: 0 4px;">
            ${button('Login Email', outlookUrl, '#0078d4')}
          </td>
        </tr>
      </table>

      <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
        If you have any questions, please contact the IT or HR team.
      </p>
    `;
    return baseTemplate(content);
  }

  // Existing M365 account: employee info + only PeopleHub credential
  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Hello, ${data.name}!</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Your ${appName} account credentials are ready. Below are your details.
    </p>

    <!-- Employee Info -->
    ${employeeInfoSection(data)}

    <!-- PeopleHub Credential -->
    ${credentialBox('🔐', `${appName} HRIS Login`, [
      { label: 'URL', value: `<a href="${data.loginUrl}" style="color: #2563eb; text-decoration: none;">${data.loginUrl}</a>` },
      { label: 'Email', value: data.email },
      ...(data.temporaryPassword ? [{ label: 'Password', value: data.temporaryPassword, mono: true }] : []),
    ])}

    <!-- Info -->
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <p style="margin: 0; color: #1e40af; font-size: 13px;">
        ℹ️ Your office email password <strong>has not changed</strong>. Only your ${appName} password has been set.
      </p>
    </div>

    <!-- Warning -->
    ${data.temporaryPassword ? `
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        <strong>⚠️</strong> You must change your password on first login.
      </p>
    </div>
    ` : ''}

    <div style="text-align: center; margin-bottom: 24px;">
      ${button('Login Now', data.loginUrl)}
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
      If you have any questions, please contact the IT or HR team.
    </p>
  `;

  return baseTemplate(content);
}

// Reset Password Email Template
export function resetPasswordEmailTemplate(data: ResetPasswordEmailData): string {
  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Reset Password</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Hello ${data.name},<br><br>
      We received a request to reset your account password. Click the button below to create a new password.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      ${button('Reset Password', data.resetUrl)}
    </div>

    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        <strong>Note:</strong> This link will expire in ${data.expiresIn}.
        If you did not request a password reset, please ignore this email.
      </p>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px;">
      If the button doesn't work, copy and paste the following URL into your browser:<br>
      <a href="${data.resetUrl}" style="color: ${primaryColor}; word-break: break-all;">${data.resetUrl}</a>
    </p>
  `;

  return baseTemplate(content);
}

// Leave Request Email Template (to Approver)
export function leaveRequestEmailTemplate(data: LeaveRequestEmailData): string {
  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">New Leave Request</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Hello ${data.approverName},<br><br>
      You have a new leave request that requires your approval.
    </p>

    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 140px;">Employee</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Leave Type</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.leaveType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Date</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.startDate} - ${data.endDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Total Days</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.totalDays} day(s)</td>
        </tr>
        ${data.reason ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; vertical-align: top;">Reason</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.reason}</td>
          </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${button('Review & Approve', data.approvalUrl)}
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
      Please log in to ${appName} to approve or reject this request.
    </p>
  `;

  return baseTemplate(content);
}

// Leave Approval/Rejection Email Template (to Employee)
export function leaveApprovalEmailTemplate(data: LeaveApprovalEmailData): string {
  const isApproved = data.status === 'approved';
  const statusColor = isApproved ? '#16a34a' : '#dc2626';
  const statusText = isApproved ? 'Approved' : 'Rejected';
  const statusBgColor = isApproved ? '#dcfce7' : '#fee2e2';

  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Leave Request ${statusText}</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Hello ${data.employeeName},<br><br>
      Your leave request has been ${isApproved ? 'approved' : 'rejected'} by ${data.approverName}.
    </p>

    <div style="background-color: ${statusBgColor}; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
      <span style="color: ${statusColor}; font-size: 16px; font-weight: 700;">
        ${isApproved ? '✓' : '✕'} ${statusText.toUpperCase()}
      </span>
    </div>

    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 140px;">Leave Type</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.leaveType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Date</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.startDate} - ${data.endDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Total Days</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.totalDays} day(s)</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Processed by</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.approverName}</td>
        </tr>
        ${data.rejectionReason ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; vertical-align: top;">Rejection Reason</td>
            <td style="padding: 8px 0; color: #dc2626; font-size: 14px;">${data.rejectionReason}</td>
          </tr>
        ` : ''}
      </table>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
      ${isApproved
        ? 'Enjoy your time off!'
        : 'If you have any questions, please contact your manager or HR.'}
    </p>
  `;

  return baseTemplate(content);
}

// Leave Reminder Email Template (to Approver)
export function leaveReminderEmailTemplate(data: LeaveReminderEmailData): string {
  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Reminder: Pending Leave Requests</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Hello ${data.approverName},<br><br>
      You have <strong>${data.pendingCount} leave request(s)</strong> waiting for your approval.
    </p>

    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #92400e; font-size: 32px; font-weight: 700;">${data.pendingCount}</span>
      <p style="margin: 8px 0 0; color: #92400e; font-size: 14px;">Pending Request(s)</p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${button('Review Now', data.approvalUrl)}
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
      Please process these requests promptly to avoid delays.
    </p>
  `;

  return baseTemplate(content);
}
