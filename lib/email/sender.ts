import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendResult = { sent: boolean; error?: string };

// Email is dormant until SMTP_HOST is set. Every other module treats sending as
// best-effort — this is the one place that knows whether a transport exists.
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // implicit TLS on 465, STARTTLS otherwise
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

function fromAddress(): string {
  return process.env.SMTP_FROM ?? "Truvis.info <no-reply@truvis.info>";
}

// Never throws — notifications are fire-and-forget, and this contract lives here
// so no call site has to guard the send.
export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const transport = getTransporter();
  if (!transport) {
    console.warn(
      `[email] SMTP not configured — skipping: "${msg.subject}" → ${msg.to}`,
    );
    return { sent: false, error: "unconfigured" };
  }
  try {
    await transport.sendMail({
      from: fromAddress(),
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email] send failed for "${msg.subject}" → ${msg.to}:`, message);
    return { sent: false, error: message };
  }
}
