import { describe, expect, it } from "vitest";
import { mapStripeStatus } from "./stripe-status";

describe("mapStripeStatus", () => {
  it("passes through statuses that exist in the DB enum", () => {
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("trialing")).toBe("trialing");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("incomplete")).toBe("incomplete");
  });

  it("degrades non-entitled terminal states to canceled", () => {
    expect(mapStripeStatus("canceled")).toBe("canceled");
    expect(mapStripeStatus("unpaid")).toBe("canceled");
    expect(mapStripeStatus("paused")).toBe("canceled");
    expect(mapStripeStatus("incomplete_expired")).toBe("canceled");
  });

  it("defaults unknown statuses to canceled (fail safe, no enum cast error)", () => {
    expect(mapStripeStatus("something_new")).toBe("canceled");
  });
});
