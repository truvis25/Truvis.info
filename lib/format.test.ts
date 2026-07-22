import { describe, expect, it } from "vitest";
import {
  dateTileParts,
  formatAed,
  formatDate,
  formatDateTime,
  formatTime,
  parseGstLocalInput,
  toGstLocalInput,
} from "./format";

// 2026-09-18T14:00:00Z is 18:00 in Gulf Standard Time (UTC+4).
const INSTANT = "2026-09-18T14:00:00.000Z";

describe("platform-timezone formatting", () => {
  it("renders dates in GST regardless of server timezone", () => {
    expect(formatDate(INSTANT)).toBe("18 Sept 2026");
    expect(formatTime(INSTANT)).toBe("18:00");
    expect(formatDateTime(INSTANT)).toContain("18:00");
    expect(formatDateTime(INSTANT)).toContain("GST");
  });

  it("crosses the date line correctly near midnight GST", () => {
    // 22:30 UTC = 02:30 GST the NEXT day.
    const parts = dateTileParts("2026-09-18T22:30:00.000Z");
    expect(parts.day).toBe("19");
    expect(parts.month).toBe("Sept");
  });

  it("round-trips datetime-local values as GST wall clock", () => {
    const iso = parseGstLocalInput("2026-09-18T18:00");
    expect(iso).toBe(INSTANT);
    expect(toGstLocalInput(iso)).toBe("2026-09-18T18:00");
  });

  it("rejects invalid datetime-local input", () => {
    expect(parseGstLocalInput("")).toBeNull();
    expect(parseGstLocalInput("not-a-date")).toBeNull();
    expect(toGstLocalInput(null)).toBe("");
  });

  it("formats AED amounts with fixed grouping", () => {
    expect(formatAed(1500000)).toBe("AED 1,500,000");
    expect(formatAed("2500")).toBe("AED 2,500");
    expect(formatAed(Number.NaN)).toBe("AED —");
  });
});
