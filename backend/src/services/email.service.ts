import { Resend } from 'resend';
import { config } from '../config';
import logger from '../utils/logger';

const resend = new Resend(config.email.resendApiKey);

const BASE_URL = config.appUrl;

const emailTemplate = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0F2044; padding: 32px 40px; text-align: center; }
    .header h1 { color: #C9A84C; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .header p { color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px; }
    .body { padding: 40px; color: #333; line-height: 1.6; }
    .btn { display: inline-block; background: #0F2044; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { background: #f8f9fb; padding: 20px 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TruVis</h1>
      <p>Verified Business Ecosystem</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TruVis Corporate Services. All rights reserved.</p>
      <p><a href="${BASE_URL}/privacy" style="color:#999">Privacy Policy</a> · <a href="${BASE_URL}/terms" style="color:#999">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>
`;

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!config.email.resendApiKey) {
    logger.info('[Email] No API key configured, skipping email send', { to, subject });
    return;
  }

  try {
    await resend.emails.send({
      from: config.email.from,
      to,
      subject,
      html,
    });
    logger.info('[Email] Sent', { to, subject });
  } catch (err) {
    logger.error('[Email] Send failed', { err, to, subject });
    throw err;
  }
}

export const emailService = {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${BASE_URL}/verify-email?token=${token}`;
    await send(
      email,
      'Verify your TruVis.info account',
      emailTemplate(`
        <h2 style="color:#0F2044">Welcome to TruVis.info</h2>
        <p>Thank you for registering. Please verify your email address to activate your account.</p>
        <p>This link expires in <strong>24 hours</strong>.</p>
        <a href="${url}" class="btn">Verify Email Address</a>
        <hr class="divider">
        <p style="font-size:13px;color:#666">If you did not create an account, you can safely ignore this email.</p>
        <p style="font-size:12px;color:#999">Or copy this URL: ${url}</p>
      `)
    );
  },

  async sendApprovalEmail(email: string, companyName: string, profileUrl: string): Promise<void> {
    await send(
      email,
      '🎉 Your company profile has been approved — TruVis.info',
      emailTemplate(`
        <h2 style="color:#0F2044">Congratulations!</h2>
        <p>Your company profile for <strong>${companyName}</strong> has been reviewed and <strong style="color:#16a34a">approved</strong>.</p>
        <p>Your profile is now live on TruVis.info and visible to the public.</p>
        <a href="${profileUrl}" class="btn">View Your Profile</a>
        <hr class="divider">
        <p>To strengthen your profile and improve your ranking, consider:</p>
        <ul>
          <li>Uploading a company logo and cover image</li>
          <li>Adding your services and products</li>
          <li>Including gallery images</li>
          <li>Filling in all contact details</li>
        </ul>
      `)
    );
  },

  async sendRejectionEmail(email: string, companyName: string, reason: string): Promise<void> {
    await send(
      email,
      'Update on your TruVis.info profile submission',
      emailTemplate(`
        <h2 style="color:#0F2044">Profile Submission Update</h2>
        <p>Thank you for submitting <strong>${companyName}</strong> for review.</p>
        <p>After reviewing your submission, we were unable to approve it at this time.</p>
        <div style="background:#fff8f0;border-left:4px solid #f59e0b;padding:16px;margin:24px 0;border-radius:0 4px 4px 0">
          <strong>Reason:</strong><br>${reason}
        </div>
        <p>You can update your profile and resubmit for review.</p>
        <a href="${BASE_URL}/dashboard" class="btn">Go to Dashboard</a>
      `)
    );
  },

  async sendBadgeEmail(email: string, companyName: string, badge: 'client' | 'verified'): Promise<void> {
    const badgeLabel = badge === 'verified' ? '★ TruVis Verified' : '✔ TruVis Client';
    await send(
      email,
      `${badgeLabel} badge awarded — TruVis.info`,
      emailTemplate(`
        <h2 style="color:#0F2044">Badge Awarded</h2>
        <p>Congratulations! <strong>${companyName}</strong> has been awarded the <strong style="color:#C9A84C">${badgeLabel}</strong> badge on TruVis.info.</p>
        <p>This badge is now displayed on your public profile, signaling your verified status to potential business partners.</p>
        <a href="${BASE_URL}/dashboard" class="btn">View Your Profile</a>
      `)
    );
  },

  async sendContactNotification(
    adminEmail: string,
    companyEmail: string,
    senderName: string,
    senderEmail: string,
    subject: string,
    message: string,
    companyName: string
  ): Promise<void> {
    const body = emailTemplate(`
      <h2 style="color:#0F2044">New Contact Inquiry</h2>
      <p>A visitor has submitted a contact inquiry for <strong>${companyName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#666;width:120px">From:</td><td><strong>${senderName}</strong> (${senderEmail})</td></tr>
        <tr><td style="padding:8px 0;color:#666">Subject:</td><td>${subject || '(No subject)'}</td></tr>
      </table>
      <hr class="divider">
      <p><strong>Message:</strong></p>
      <div style="background:#f8f9fb;padding:16px;border-radius:4px;white-space:pre-wrap">${message}</div>
    `);

    await Promise.all([
      send(adminEmail, `[TruVis] New inquiry: ${companyName}`, body),
      send(companyEmail, `New inquiry via TruVis.info: ${subject || senderName}`, body),
    ]);
  },

  async sendAdminNotification(adminEmail: string, subject: string, content: string): Promise<void> {
    await send(
      adminEmail,
      `[TruVis Admin] ${subject}`,
      emailTemplate(`<h2 style="color:#0F2044">${subject}</h2>${content}`)
    );
  },
};
