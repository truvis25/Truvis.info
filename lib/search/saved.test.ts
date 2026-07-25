import { describe, expect, it } from "vitest";
import {
  normalizeParams,
  describeSearch,
  searchToHref,
  newKeys,
} from "./saved";

describe("normalizeParams", () => {
  it("keeps only a kind's params and drops empties", () => {
    expect(
      normalizeParams("directory", {
        q: "logistics",
        industry: "H.52",
        jurisdiction: "",
        type: "fundraise", // not a directory param
      }),
    ).toEqual({ q: "logistics", industry: "H.52" });

    expect(
      normalizeParams("marketplace", {
        q: "  ", // whitespace → dropped
        type: "equity_sale",
        sector: "Fintech",
        industry: "H.52", // not a marketplace param
      }),
    ).toEqual({ type: "equity_sale", sector: "Fintech" });
  });
});

describe("describeSearch", () => {
  it("summarizes directory and marketplace searches", () => {
    expect(describeSearch("directory", { q: "logistics", jurisdiction: "AE-DU" })).toBe(
      'Directory: "logistics" · AE-DU',
    );
    expect(describeSearch("marketplace", { type: "equity_sale" })).toBe(
      "Marketplace: equity sale",
    );
    expect(describeSearch("directory", {})).toBe("Directory: all");
  });
});

describe("searchToHref", () => {
  it("rebuilds the browse URL, dropping empties", () => {
    expect(searchToHref("directory", { q: "x", industry: "H.52" })).toBe(
      "/directory?q=x&industry=H.52",
    );
    expect(searchToHref("marketplace", {})).toBe("/marketplace");
  });
});

describe("newKeys", () => {
  it("returns only keys not already seen, order-preserving and deduped", () => {
    expect(newKeys(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
    expect(newKeys(["a", "a", "b"], [])).toEqual(["a", "b"]);
    expect(newKeys(["a", "b"], ["a", "b"])).toEqual([]);
  });
});
