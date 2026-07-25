import { describe, expect, it } from "vitest";
import {
  INDUSTRIES,
  industryLabel,
  industryByCode,
  industryBySlug,
  industryHref,
} from "./industries";

describe("industry taxonomy", () => {
  it("has unique codes and slugs", () => {
    const codes = INDUSTRIES.map((i) => i.code);
    const slugs = INDUSTRIES.map((i) => i.slug);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses url-safe slugs and non-empty labels/blurbs", () => {
    for (const i of INDUSTRIES) {
      expect(i.slug).toMatch(/^[a-z0-9-]+$/);
      expect(i.label.length).toBeGreaterThan(0);
      expect(i.blurb.length).toBeGreaterThan(0);
    }
  });

  it("resolves labels by code and falls back to the raw code", () => {
    expect(industryLabel("H.52")).toBe("Logistics & Transport");
    expect(industryLabel("ZZ.99")).toBe("ZZ.99"); // unknown → passthrough
    expect(industryLabel(null)).toBe("");
  });

  it("round-trips code ↔ slug lookups", () => {
    for (const i of INDUSTRIES) {
      expect(industryByCode(i.code)?.slug).toBe(i.slug);
      expect(industryBySlug(i.slug)?.code).toBe(i.code);
    }
  });

  it("builds hrefs only for known codes", () => {
    expect(industryHref("H.52")).toBe("/directory/industry/logistics");
    expect(industryHref("ZZ.99")).toBeNull();
    expect(industryHref(null)).toBeNull();
  });
});
