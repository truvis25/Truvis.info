import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

export function verifyLumaWebhookSignature({
  secret,
  signatureHeader,
  rawBody,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  secret: string;
  signatureHeader: string;
  rawBody: string;
  nowSeconds?: number;
}): boolean {
  const parts = new Map<string, string>();
  for (const part of signatureHeader.split(",")) {
    const index = part.indexOf("=");
    if (index > 0) parts.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
  }

  const timestampRaw = parts.get("t");
  const actual = parts.get("v1");
  const timestamp = Number(timestampRaw);
  if (!timestampRaw || !actual || !Number.isFinite(timestamp)) return false;
  if (Math.abs(nowSeconds - timestamp) > MAX_WEBHOOK_AGE_SECONDS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestampRaw}.${rawBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
