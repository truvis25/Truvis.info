import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { makeLumaSlug, lumaSlugFromUrl } from "./identity";
import { verifyLumaWebhookSignature } from "./webhook";

describe("Luma correlation ids", () => {
  it("creates a stable API-safe slug within Luma's limit", () => {
    const slug = makeLumaSlug(
      "A Very Long Abu Dhabi Founder Event With Extra Words",
      "123e4567-e89b-12d3-a456-426614174000",
    );
    expect(slug).toBe("truvis-a-very-long-abu-dhabi-founder-even-123e4567");
    expect(slug.length).toBeLessThanOrEqual(50);
    expect(lumaSlugFromUrl(`https://luma.com/${slug}`)).toBe(slug);
  });
});

describe("Luma webhook signatures", () => {
  it("accepts a current valid HMAC and rejects replays", () => {
    const secret = "whsec_test";
    const rawBody = JSON.stringify({ type: "event.created", data: { id: "evt-1" } });
    const timestamp = 1_800_000_000;
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    const signatureHeader = `t=${timestamp},v1=${signature}`;

    expect(
      verifyLumaWebhookSignature({
        secret,
        signatureHeader,
        rawBody,
        nowSeconds: timestamp + 30,
      }),
    ).toBe(true);
    expect(
      verifyLumaWebhookSignature({
        secret,
        signatureHeader,
        rawBody,
        nowSeconds: timestamp + 301,
      }),
    ).toBe(false);
  });
});
