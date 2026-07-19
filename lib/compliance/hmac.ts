import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 5 * 60;

// Verifies X-Truvis-Signature: t=<unix>,v1=<hmac_sha256(t + "." + body)>
// per the webhook contract in docs/ARCHITECTURE.md §5.3.
export function verifyWebhookSignature(
  header: string | null,
  body: string,
  secret: string,
  now: Date = new Date(),
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=", 2) as [string, string]),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!Number.isFinite(timestamp) || !signature) return false;
  if (Math.abs(now.getTime() / 1000 - timestamp) > TOLERANCE_SECONDS) {
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
