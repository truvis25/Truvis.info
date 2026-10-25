import nodemailer from "npm:nodemailer@9.0.3";
import { EMAIL_FROM, HOUSE_EMAIL, type Mailer } from "./email.ts";

export function smtpMailer(env: (key: string) => string | undefined): Mailer {
  const host = env("FOUNDER_HOUSE_SMTP_HOST")?.trim();
  const user = env("FOUNDER_HOUSE_SMTP_USER")?.trim();
  const pass = env("FOUNDER_HOUSE_SMTP_PASS");
  const port = env("FOUNDER_HOUSE_SMTP_PORT") ?? "465";
  const missing = [
    !host && "SMTP host",
    !user && "SMTP username",
    !pass && "SMTP password",
    port !== "465" && "TLS port 465",
  ].filter(Boolean) as string[];
  return {
    configured: missing.length === 0,
    missing,
    async send(message) {
      if (missing.length) throw Error("email_not_configured");
      // Supabase blocks ports 25 and 587. Require implicit TLS on 465 and retain
      // normal certificate verification; never downgrade to plaintext SMTP.
      const transport = nodemailer.createTransport({
        host,
        port: 465,
        secure: true,
        auth: { user, pass },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 6000,
        dnsTimeout: 4000,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          transport.sendMail({
            ...message,
            from: EMAIL_FROM,
            replyTo: HOUSE_EMAIL,
          }),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => {
              transport.close();
              reject(Error("email_timeout"));
            }, 8000);
          }),
        ]);
        return {
          accepted:
            result.accepted?.some(
              (address: unknown) =>
                String(address).toLowerCase() === message.to.toLowerCase(),
            ) === true,
        };
      } finally {
        if (timeout) clearTimeout(timeout);
        transport.close();
      }
    },
  };
}
