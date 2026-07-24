import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock nodemailer before importing the module under test.
const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));
vi.mock("nodemailer", () => ({
  default: { createTransport },
}));

const ENV_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  sendMail.mockReset();
  createTransport.mockClear();
  vi.resetModules();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("sendEmail", () => {
  it("skips and reports unconfigured when SMTP_HOST is unset", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendEmail, isEmailConfigured } = await import("./sender");
    expect(isEmailConfigured()).toBe(false);
    const result = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>x</p>" });
    expect(result).toEqual({ sent: false, error: "unconfigured" });
    expect(sendMail).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("builds a transport and sends when configured", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    process.env.SMTP_FROM = "Truvis <no-reply@truvis.info>";
    sendMail.mockResolvedValue({ messageId: "1" });

    const { sendEmail, isEmailConfigured } = await import("./sender");
    expect(isEmailConfigured()).toBe(true);
    const result = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>x</p>" });

    expect(result).toEqual({ sent: true });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.com",
        port: 465,
        secure: true, // 465 => implicit TLS
        auth: { user: "user", pass: "pass" },
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Truvis <no-reply@truvis.info>",
        to: "a@b.com",
        subject: "Hi",
      }),
    );
  });

  it("returns {sent:false} without throwing when the transport rejects", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    sendMail.mockRejectedValue(new Error("connection refused"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const { sendEmail } = await import("./sender");
    const result = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>x</p>" });

    expect(result.sent).toBe(false);
    expect(result.error).toContain("connection refused");
    err.mockRestore();
  });
});
