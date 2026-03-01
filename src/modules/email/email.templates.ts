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
<html lang="id">
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
                Email ini dikirim otomatis, mohon tidak membalas email ini.
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

// Welcome Email Template
export function welcomeEmailTemplate(data: WelcomeEmailData): string {
  const outlookUrl = data.outlookUrl || 'https://outlook.office.com';

  // New M365 account: show both email & PeopleHub credentials (same password)
  if (data.isNewM365Account) {
    const content = `
      <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Selamat Datang, ${data.name}!</h2>
      <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
        Akun email kantor dan ${appName} Anda telah berhasil dibuat. Berikut detail login Anda.
      </p>

      <!-- Credential Box -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${primaryColor};">
        <p style="margin: 0 0 12px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">📧 Email Kantor & ${appName}</p>
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 13px; width: 100px;">Email</td>
            <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.email}</td>
          </tr>
          ${data.temporaryPassword ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Password</td>
            <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-family: monospace; font-weight: 600;">${data.temporaryPassword}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Warning -->
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          <strong>⚠️ Penting:</strong> Password di atas berlaku untuk <strong>email kantor</strong> dan <strong>${appName}</strong>. Anda wajib mengganti password saat login pertama kali.
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
        Jika ada pertanyaan, silakan hubungi tim IT atau HR.
      </p>
    `;
    return baseTemplate(content);
  }

  // Existing M365 account: only PeopleHub credential
  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Halo, ${data.name}!</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Password ${appName} Anda telah direset. Berikut detail login terbaru Anda.
    </p>

    <!-- Credential Box -->
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${primaryColor};">
      <p style="margin: 0 0 12px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">🔑 Login ${appName}</p>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px; width: 100px;">Email</td>
          <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.email}</td>
        </tr>
        ${data.temporaryPassword ? `
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Password</td>
          <td style="padding: 4px 0; color: #1e293b; font-size: 14px; font-family: monospace; font-weight: 600;">${data.temporaryPassword}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- Info -->
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <p style="margin: 0; color: #1e40af; font-size: 13px;">
        ℹ️ Password email kantor Anda <strong>tidak berubah</strong>. Hanya password ${appName} yang direset.
      </p>
    </div>

    <!-- Warning -->
    ${data.temporaryPassword ? `
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        <strong>⚠️</strong> Anda wajib mengganti password saat login pertama kali.
      </p>
    </div>
    ` : ''}

    <div style="text-align: center; margin-bottom: 24px;">
      ${button('Login Sekarang', data.loginUrl)}
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
      Jika ada pertanyaan, silakan hubungi tim IT atau HR.
    </p>
  `;

  return baseTemplate(content);
}

// Reset Password Email Template
export function resetPasswordEmailTemplate(data: ResetPasswordEmailData): string {
  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Reset Password</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Halo ${data.name},<br><br>
      Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      ${button('Reset Password', data.resetUrl)}
    </div>

    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        <strong>Perhatian:</strong> Link ini akan kadaluarsa dalam ${data.expiresIn}.
        Jika Anda tidak meminta reset password, abaikan email ini.
      </p>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px;">
      Jika tombol tidak berfungsi, copy dan paste URL berikut ke browser Anda:<br>
      <a href="${data.resetUrl}" style="color: ${primaryColor}; word-break: break-all;">${data.resetUrl}</a>
    </p>
  `;

  return baseTemplate(content);
}

// Leave Request Email Template (to Approver)
export function leaveRequestEmailTemplate(data: LeaveRequestEmailData): string {
  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Pengajuan Cuti Baru</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Halo ${data.approverName},<br><br>
      Anda memiliki pengajuan cuti baru yang memerlukan persetujuan Anda.
    </p>

    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 140px;">Nama Karyawan</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${data.employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Jenis Cuti</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.leaveType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Tanggal</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.startDate} - ${data.endDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Total Hari</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.totalDays} hari</td>
        </tr>
        ${data.reason ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; vertical-align: top;">Alasan</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.reason}</td>
          </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${button('Review & Approve', data.approvalUrl)}
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
      Silakan login ke ${appName} untuk menyetujui atau menolak pengajuan ini.
    </p>
  `;

  return baseTemplate(content);
}

// Leave Approval/Rejection Email Template (to Employee)
export function leaveApprovalEmailTemplate(data: LeaveApprovalEmailData): string {
  const isApproved = data.status === 'approved';
  const statusColor = isApproved ? '#16a34a' : '#dc2626';
  const statusText = isApproved ? 'Disetujui' : 'Ditolak';
  const statusBgColor = isApproved ? '#dcfce7' : '#fee2e2';

  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Pengajuan Cuti ${statusText}</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Halo ${data.employeeName},<br><br>
      Pengajuan cuti Anda telah ${isApproved ? 'disetujui' : 'ditolak'} oleh ${data.approverName}.
    </p>

    <div style="background-color: ${statusBgColor}; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
      <span style="color: ${statusColor}; font-size: 16px; font-weight: 700;">
        ${isApproved ? '✓' : '✕'} ${statusText.toUpperCase()}
      </span>
    </div>

    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 140px;">Jenis Cuti</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.leaveType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Tanggal</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.startDate} - ${data.endDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Total Hari</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.totalDays} hari</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Diproses oleh</td>
          <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${data.approverName}</td>
        </tr>
        ${data.rejectionReason ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; vertical-align: top;">Alasan Penolakan</td>
            <td style="padding: 8px 0; color: #dc2626; font-size: 14px;">${data.rejectionReason}</td>
          </tr>
        ` : ''}
      </table>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
      ${isApproved
        ? 'Selamat menikmati cuti Anda!'
        : 'Jika ada pertanyaan, silakan hubungi atasan atau HR.'}
    </p>
  `;

  return baseTemplate(content);
}

// Leave Reminder Email Template (to Approver)
export function leaveReminderEmailTemplate(data: LeaveReminderEmailData): string {
  const content = `
    <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px;">Pengingat: Pengajuan Cuti Menunggu</h2>
    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      Halo ${data.approverName},<br><br>
      Anda memiliki <strong>${data.pendingCount} pengajuan cuti</strong> yang menunggu persetujuan Anda.
    </p>

    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #92400e; font-size: 32px; font-weight: 700;">${data.pendingCount}</span>
      <p style="margin: 8px 0 0; color: #92400e; font-size: 14px;">Pengajuan Menunggu</p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${button('Review Sekarang', data.approvalUrl)}
    </div>

    <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
      Mohon segera proses pengajuan untuk menghindari keterlambatan.
    </p>
  `;

  return baseTemplate(content);
}
