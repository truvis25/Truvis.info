import { describe, expect, it } from "vitest";
import { pageCountFor, parsePage } from "./pagination";

describe("parsePage", () => {
  it("defaults to 1 for missing or junk input", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
  });

  it("parses positive integers", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage("42")).toBe(42);
  });
});

describe("pageCountFor", () => {
  it("is at least 1 even when empty", () => {
    expect(pageCountFor(0, 20)).toBe(1);
  });

  it("rounds up partial pages", () => {
    expect(pageCountFor(20, 20)).toBe(1);
    expect(pageCountFor(21, 20)).toBe(2);
    expect(pageCountFor(60, 24)).toBe(3);
  });
});
